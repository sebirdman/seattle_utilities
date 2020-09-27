const fetch = require("node-fetch");

export async function get_monthly_consumption_history(user: any, account: any, token: any, cycle: any) {

    const historical_data_per_meter: any = {};
    for (const meter of cycle.meters) {
        let monthly_breakdown_payload = {
            customerId: user.customerId,
            accountContext: {
                accountNumber: account.accountNumber,
                serviceId: cycle.serviceId,
            },
            startDate: account.currentBillDate,
            endDate: null,
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