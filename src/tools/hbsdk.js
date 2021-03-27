import $http from "@/http";
import moment from "moment";
import HmacSHA256 from "crypto-js/hmac-sha256";
import CryptoJS from "crypto-js";

const config = {
  access_key: "f989c12e-24c3ff94-c617c4b0-bewr5drtmh",
  secret_key: "f1ed7f50-3fbb8969-0091d21d-3a658",
  account_id: "179960437",
  account_id_pro: "18317091",
  trade_password: ""
};

const URL = "https://api.huobi.pro";

const HOST = "api.huobi.pro";

const params = {
  AccessKeyId: config.access_key,
  SignatureMethod: "HmacSHA256",
  SignatureVersion: 2,
  Timestamp: moment.utc().format("YYYY-MM-DDTHH:mm:ss")
};

function signSha(method, baseurl, path, data) {
  const pars = [];
  for (let item in data) {
    pars.push(item + "=" + encodeURIComponent(data[item]));
  }
  let p = pars.sort().join("&");
  const meta = [method, baseurl, path, p].join("\n");
  // console.log(meta);
  const hash = HmacSHA256(meta, config.secret_key); // 7
  const Signature = encodeURIComponent(CryptoJS.enc.Base64.stringify(hash));
  // console.log(`Signature: ${Signature}`);
  p += `&Signature=${Signature}`;
  // console.log(p);
  return p;
}

export function getAccount() {
  const body = params;
  const path = "/v1/account/accounts";
  const payload = signSha("GET", HOST, path, body);
  const url = `${URL}${path}?${payload}`;
  $http.get(url).then(res => {
    console.log(res);
  });
}

export function getHistory() {
  // const dateTime = new Date("2021-03-01").getTime();
  // const timestamp = Math.floor(dateTime / 1000);
  const body = {
    ...params,
    ...{
      // "account-id": config.account_id_pro,
      "start-date": "2021-03-24",
      symbol: "oxtusdt",
      "end-date": "2021-03-25"
    }
  };
  const path = "/v1/order/matchresults";
  const payload = signSha("GET", HOST, path, body);
  const url = `${URL}${path}?${payload}`;
  $http.get(url).then(res => {
    console.log(res);
  });
}
