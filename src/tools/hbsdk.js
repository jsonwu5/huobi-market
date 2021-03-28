import $http from "@/http";
import moment from "moment";
import HmacSHA256 from "crypto-js/hmac-sha256";
import CryptoJS from "crypto-js";
import { splitArr } from "@/tools";

const config = {
  access_key: "",
  secret_key: "",
  account_id: "",
  account_id_pro: "",
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

function get(path, body) {
  const data = {
    ...params,
    ...body
  };
  return new Promise((resolve, reject) => {
    const payload = signSha("GET", HOST, path, data);
    const url = `${URL}${path}?${payload}`;
    $http
      .get(url)
      .then(res => {
        resolve(res);
      })
      .catch(reject);
  });
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

export function getHistory(path, data) {
  // 枚举两个日期之间所有日期
  const Dates = function(startDate, endDate) {
    const dates = [];

    const currDate = moment(startDate).startOf("day");
    const lastDate = moment(endDate).startOf("day");

    while (currDate.add(1, "days").diff(lastDate) < 0) {
      dates.push(moment(currDate.clone().toDate()).format("YYYY-MM-DD"));
    }

    return [
      moment(startDate).format("YYYY-MM-DD"),
      ...dates,
      moment(endDate).format("YYYY-MM-DD")
    ];
  };
  // 将用户输入的日期范围转换成范围数组 ["2021-03-26", "2021-03-27"]
  const start = data["start-date"];
  const end = data["end-date"];
  const arr = [];
  splitArr(Dates(start, end), 2, true).forEach(item => {
    arr.push(
      get(path, {
        ...data,
        ...{
          "start-date": item[0],
          "end-date": item[1]
        }
      })
    );
  });
  // 分成10个一组，请求限制为 20次/2秒
  const request = splitArr(arr, 10);
  // 分批请求
  request.forEach(item => {
    const timer = setTimeout(() => {
      Promise.all(item).then(values => {
        console.log(values);
      });
      clearTimeout(timer);
    }, 5000);
  });
}
