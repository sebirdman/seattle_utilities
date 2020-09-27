const fetch = require("node-fetch");


export async function get_account_holders(user: any, token: any) {
  const person_id_payload = {
    customerId: user.customerId,
    companyCode: "SCL",
    page: "1",
    account: [],
    sortColumn: "DUED",
    sortOrder: "DESC",
  };

  const get_person_id = await fetch(
    "https://myutilities.seattle.gov/rest/account/list/some",
    {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      method: "post",
      body: JSON.stringify(person_id_payload),
    }
  );

  const person_response = await get_person_id.json();
  return person_response.account;
}


