const fetch = require("node-fetch");

export async function get_bill_list(user: any, account: any, token: any) {
    const list_payload = {
      customerId: user.customerId,
      accountContext: {
        accountNumber: account.accountNumber,
        personId: account.personId,
        companyCd: "SCL",
        serviceAddress: account.serviceAddress,
      },
      csrId: user.userName,
      type: "Consumption",
      currentBillDate: account.currentBillDate,
      period: "3",
    };
  
    // get list now
    const account_list_resp = await fetch(
      "https://myutilities.seattle.gov/rest/billing/comparison",
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        method: "post",
        body: JSON.stringify(list_payload),
      }
    );

  
    const account_list_json = await account_list_resp.json();
    return account_list_json.billList;
  }