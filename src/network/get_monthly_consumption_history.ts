import { pad } from "../custom_utils/utils";

const fetch = require("node-fetch");

function generate_mdy_datestring(day: Date) {
    return pad(day.getUTCMonth() + 1) +
        "/" +
        pad(day.getUTCDate()) +
        "/" +
        day.getUTCFullYear();
}

export async function get_monthly_consumption_history(user: any, account: any, token: any, cycle: any) {

    const historical_data_per_meter: any = {};

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterday_string = generate_mdy_datestring(yesterday);

    const today = new Date();
    const today_string = generate_mdy_datestring(today);


    for (const meter of cycle.meters) {
        let monthly_breakdown_payload = {
            customerId: user.customerId,
            accountContext: {
                accountNumber: account.accountNumber,
                serviceId: cycle.serviceId,
            },
            startDate: yesterday_string,
            endDate: today_string,
            port: meter,
        };

        // get list now
        const monthly_breakdown_resp = await fetch(
            "https://myutilities.seattle.gov/rest/usage/month",
            {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                },
                method: "post",
                body: JSON.stringify(monthly_breakdown_payload),
            }
        );

        const monthly_list_json = await monthly_breakdown_resp.json();
        historical_data_per_meter[meter] = monthly_list_json.history;
    }

    return historical_data_per_meter;
}