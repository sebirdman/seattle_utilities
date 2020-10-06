
const fetch = require("node-fetch");
var HTMLParser = require("node-html-parser");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


function walk_to_form(root_node: any): any {
    for (const child_node of root_node.childNodes) {
        switch (child_node._tag_name) {
            case "BODY":
            case "HTML":
                return walk_to_form(child_node);
            case "FORM":
                return child_node;
            default:
                break;
        }
    }
}

function extract_form_data(raw_html: string) {
    const extracted_search_params = new URLSearchParams();
    const root = HTMLParser.parse(raw_html);
    const form_node = walk_to_form(root);
    for (const form_input of form_node.childNodes) {
        extracted_search_params.append(form_input.getAttribute("name"), form_input.getAttribute("value"));
    }
    return {
        search_params: extracted_search_params,
        url: form_node.getAttribute("ACTION")
    }
}

async function get_oracle_identity_url() {
    // get url for oracle identity manager
    const data = await fetch("https://myutilities.seattle.gov/rest/auth/ssologin", {
        headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            Host: "myutilities.seattle.gov",
        },
        redirect: "manual",
    });
    return data.headers.get("location");
}

async function get_oracle_identity_cookie(oracle_identity_endpoint: string, cookie?: string) {
    // talk to the oracle identity manager
    let info = await fetch(oracle_identity_endpoint, {
        headers: {
            Cookie: cookie,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
        redirect: "manual",
    });
    return {
        cookie: info.headers.get("set-cookie"),
        url: info.headers.get("location"),
        html: await info.text(),
    }
}

async function get_utility_user_data(username_temp_uuid: string) {

    const last_data_really_really = new URLSearchParams();
    last_data_really_really.append("grant_type", "password");
    last_data_really_really.append("logintype", "sso");
    last_data_really_really.append("username", username_temp_uuid);

    const final_login_data_for_real = await fetch(
        "https://myutilities.seattle.gov/rest/oauth/token",
        {
            headers: {
                Authorization: "Basic " + Buffer.from("webClientIdPassword:secret").toString('base64'),
            },
            method: "post",
            body: last_data_really_really,
            redirect: "manual",
        }
    );

    const final_login_data_for_real_resp = await final_login_data_for_real.json();

    const token =
        final_login_data_for_real_resp.token_type.toUpperCase() +
        " " +
        final_login_data_for_real_resp.access_token;

    return { token, user: final_login_data_for_real_resp.user };
}

export async function do_login(raw_username: string, raw_password: string) {
    const oracle_identity_endpoint = await get_oracle_identity_url();
    // talk to the oracle identity manager
    let oracle_identity_data = await get_oracle_identity_cookie(oracle_identity_endpoint);
    oracle_identity_data = await get_oracle_identity_cookie(oracle_identity_data.url, oracle_identity_data.cookie);

    let current_cookie = oracle_identity_data.cookie
    const form_data_one = extract_form_data(oracle_identity_data.html);
    const login_data = await fetch(form_data_one.url, {
        method: "post",
        body: form_data_one.search_params,
    });

    const script_payload = await login_data.text();

    const dom = new JSDOM(script_payload, {
        url: "https://example.org/",
        runScripts: "dangerously",
    });
    const signinAt = dom.window.sessionStorage.getItem("signinAT");
    const baseUri = dom.window.sessionStorage.getItem("baseUri");
    const initialState = dom.window.sessionStorage.getItem("initialState");

    const payload = {
        credentials: {
            password: raw_password,
            username: raw_username,
        },
        initialState: JSON.parse(initialState),
        signinAT: signinAt,
    };

    const auth_data_req = await fetch("https://login.seattle.gov/authenticate", {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const auth_data = await auth_data_req.json();

    const session_data = new URLSearchParams();
    session_data.append("authnToken", auth_data.authnToken);

    const identity_resp = await fetch(baseUri + "/sso/v1/sdk/session", {
        headers: {
            Cookie: current_cookie,
        },
        method: "post",
        body: session_data,
    });
    current_cookie = identity_resp.headers.get("set-cookie");

    const identity_text_html = await identity_resp.text();
    const form_data = extract_form_data(identity_text_html);
    const login_resp = await fetch(form_data.url, {
        headers: {
            Cookie: current_cookie,
        },
        method: "post",
        body: form_data.search_params,
        redirect: "manual",
    });

    const login_html = await login_resp.text();
    current_cookie = login_resp.headers.get("set-cookie");
    const form_data_three = extract_form_data(login_html);
    const saml_response = await fetch(form_data_three.url, {
        headers: {
            Cookie: current_cookie,
        },
        method: "post",
        body: form_data_three.search_params,
        redirect: "manual",
    });

    const final_url_thing = saml_response.headers.get("location");
    const username = final_url_thing.substring(
        final_url_thing.lastIndexOf("/") + 1
    );
    return get_utility_user_data(username);
}