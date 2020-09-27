const fetch = require("node-fetch");

export async function get_monthly_consumption_history(user: any, account: any, token: any, cycle: any) {
    let monthly_breakdown_payload = {
        customerId: user.customerId,
        accountContext: {
            accountNumber: account.accountNumber,
            serviceId: cycle.serviceId,
        },
        startDate: "09/16/2020",
        endDate: null,
        port: cycle.meters[0],
    };

    // get list now
    const montly_breakdown_resp = await fetch(
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

    const montly_list_json = await montly_breakdown_resp.json();
    return montly_list_json.history;
}