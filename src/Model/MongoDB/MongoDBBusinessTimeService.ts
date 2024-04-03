import mongoose from "mongoose";
import { Business_Day_HoursModel, Business_TimesModel } from "./MongoDBModel";

class MongoDBBusiness_TimeService {
  protected business_Day_HoursModel: mongoose.Model<any> = Business_Day_HoursModel;
  protected business_TimesModel: mongoose.Model<any> = Business_TimesModel;

  async insertBusinessTime(place_id: String, opening_hours: any) {
    try {
      if (!opening_hours) {
        return;
      }
      let daysModel = await this.organizeOpeningHours(opening_hours);
      const filter = { place_id: place_id };
      const update = {
        $set: {
          opening_hours: daysModel,
        },
      };
      const options = { upsert: true };
      let result = await this.business_TimesModel.findOneAndUpdate(filter, update, options);

      return result;
    } catch (error) {
      throw error;
    }
  }

  async organizeOpeningHours(opening_hours) {
    let { periods } = opening_hours;
    let openingTimesError = false;
    if (periods.length > 1) {
      periods.forEach((period, index) => {
        let limit = 0;

        if (period.open.day - period.close.day > 1 && period.close.day != 0) {
          let startIndex = period.open.day + 1;
          let end = false;
          while (!end && limit < 7) {
            if (startIndex == 7) {
              startIndex = 0;
            }
            let model = { close: { day: startIndex, time: "0000" }, open: { day: startIndex, time: "0000" } };
            periods.splice(startIndex, 0, model);
            if (startIndex == period.close.day - 1) {
              end = true;
            }
            startIndex++;
            limit++;
          }
          if (limit > 6) {
            openingTimesError = true;
          }
        }
      });
    }

    if (openingTimesError) {
      throw new Error(`openingTimes問題 ${periods}`);
    }
    if (periods == null) {
      return null;
    }
    const daysOfWeek = ["sun", "mon", "tues", "wed", "thur", "fri", "sat"];
    const periodHash = {};
    periods.forEach((period) => {
      if (period.close == null) {
        periodHash[`${period.open.time}`] = { open: period.open.time };
        return;
      }
      periodHash[`${period.open.time}-${period.close.time}`] = { open: period.open.time, close: period.close.time };
    });
    let periodHashArray = Object.values(periodHash);

    const results = await Business_Day_HoursModel.aggregate([
      {
        $match: {
          $or: [
            ...periodHashArray.map((period: any) => ({ $or: [{ open: period.open, close: period.close }] })),
            { $or: [{ open: "0000", close: null }] },
          ],
        },
      },
      {
        $project: { _id: 1, open: 1, close: 1 },
      },
    ]);
    let resultsHash = {};
    results.forEach((period) => {
      if (period.close == null) {
        resultsHash[`${period.open}`] = { _id: period._id, open: period.open, close: null };
        return;
      }
      resultsHash[`${period.open}-${period.close}`] = period;
    });
    let missedArray = periodHashArray.filter((period: any) => {
      if (periodHash["0000"] != null && resultsHash["0000"] != null) {
        return false;
      }
      if (periodHash[`${period.open}-${period.close}`] != null && resultsHash[`${period.open}-${period.close}`] != null) {
        return false;
      }
      return true;
    });
    let insertedBusinessHoursModels;
    if (missedArray.length > 0) {
      insertedBusinessHoursModels = await this.business_Day_HoursModel.insertMany(missedArray);
      insertedBusinessHoursModels.forEach((period) => {
        if (period.close == null) {
          resultsHash[`${period.open}`] = period;
          return;
        }
        resultsHash[`${period.open}-${period.close}`] = period;
      });
    }
    let organizedHours = {};
    periods.forEach((period) => {
      const dayOfWeek = daysOfWeek[period.open.day];
      const openingTime = period.open.time;
      if (organizedHours[dayOfWeek] == null) {
        organizedHours[dayOfWeek] = [];
      }
      let hoursModel;
      if (period.close == null) {
        hoursModel = resultsHash[`${openingTime}`];
        organizedHours[dayOfWeek].push(hoursModel);
        return;
      }
      let closingTime = period.close.time;
      hoursModel = resultsHash[`${openingTime}-${closingTime}`];
      organizedHours[dayOfWeek].push(hoursModel);
    });
    return organizedHours;
  }

  async getPlaceBusinessTimes(place_id) {
    try {
      let result = await this.business_TimesModel.findOne({ place_id: place_id }, { _id: 0, __v: 0, "opening_hours._id": 0 }).populate({
        path: "opening_hours.mon opening_hours.tues opening_hours.wed opening_hours.thur opening_hours.fri opening_hours.sat opening_hours.sun",
        select: "-__v -_id",
      });
      return result;
    } catch (error) {
      throw error;
    }
  }
  isOpenNow(hoursObject) {
    // 获取当前日期的字符串表示形式，例如 'mon'
    const currentDay = new Date().toLocaleString("tw", { weekday: "short" }).toLowerCase();

    // 获取当前时间的小时和分钟
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, "0");
    const currentMinute = now.getMinutes().toString().padStart(2, "0");
    const currentTime = currentHour + currentMinute;
    if (hoursObject[currentDay]) {
      for (const period of hoursObject[currentDay]) {
        if (period.open <= currentTime && currentTime <= period.close) {
          return true; // 当前时间在某个开门时间段内
        }
      }
    }
    return false; // 当前时间不在任何开门时间段内
  }
}
export default MongoDBBusiness_TimeService;
