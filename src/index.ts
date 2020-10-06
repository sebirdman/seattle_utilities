const fetch = require("node-fetch");

import { send_data_to_mqtt } from "./custom_utils/send_to_mqtt";
import { pad } from "./custom_utils/utils";
import { do_login } from "./network/do_login";
import { get_account_holders } from "./network/get_account_holders"
import { get_bill_list } from "./network/get_bill_list";
import { get_monthly_consumption_history } from "./network/get_monthly_consumption_history";

async function get_scl_account_info(user: any, account: any, token: any) {
  const account_holders = await get_account_holders(user, token);
  for (const one_account of account_holders) {
    if (one_account.accountNumber == account.accountNumber) {
      const bill_list = await get_bill_list(user, one_account, token);
      for (const cycle of bill_list) {
        const today = new Date();
        today.setDate(today.getDate() - 1);
        const day_string =
          today.getUTCFullYear() +
          "-" +
          pad(today.getUTCMonth() + 1) +
          "-" +
          pad(today.getUTCDate());

        const monthly_meter_history = await get_monthly_consumption_history(
          user,
          one_account,
          token,
          cycle
        );

        for (const meter in monthly_meter_history) {
          const days = monthly_meter_history[meter];
          for (const day of days) {
            if (day.readDate === day_string) {
              send_data_to_mqtt(meter, day.billedConsumption);
              break;
            }
          }
        }
      }
      break;
    }
  }
}

async function start_me_up(raw_username: any, password: any) {

  console.time("startLogin");
  const userData = await do_login(raw_username, password);
  console.timeEnd("startLogin");

  const list_payload = {
    customerId: userData.user.customerId,
    csrId: userData.user.userName,
  };
  // get list now
  const account_list_resp = await fetch(
    "https://myutilities.seattle.gov/rest/account/list",
    {
      headers: {
        Authorization: userData.token,
        "Content-Type": "application/json",
      },
      method: "post",
      body: JSON.stringify(list_payload),
    }
  );

  const account_list_json = await account_list_resp.json();
  for (const account_group of account_list_json.accountGroups) {
    if (account_group.name === "SCL") {
      for (const account of account_group.accounts) {
        get_scl_account_info(
          userData.user,
          account,
          userData.token
        );

        break;
      }
    }
  }
}

var myArgs = process.argv.slice(2);
start_me_up(myArgs[0], myArgs[1]);
