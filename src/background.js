import $http from "@/http";
import { formatNum } from "@/tools";

let TIMER = null;

chrome.runtime.onMessage.addListener(request => {
  // console.log(request, sender, sendResponse);
  if (request.type === "refreshBadge") {
    initBadge();
  }
});

/**
 * 获取指定币种的1day的K线数据
 * @param coin { String } 自选的币种
 * @param upsColor { Boolean } 红涨 = true 绿涨 = false
 */
function getMarket(coin, upsColor = true) {
  // https://huobiapi.github.io/docs/spot/v1/cn/#5ea2e0cde2-3
  $http
    .get(`/market/history/kline?period=1day&size=1&symbol=${coin}usdt`)
    .then(res => {
      // console.log(res);
      if (res.status === "ok" && res.data.length > 0) {
        const data = res.data[0];
        const text = formatNum(data.close);
        chrome.browserAction.setBadgeText({
          text: text
        });
        let color =
          data.close >= data.open
            ? upsColor
              ? "#ff704b"
              : "#39c38c"
            : upsColor
            ? "#39c38c"
            : "#ff704b";
        chrome.browserAction.setBadgeBackgroundColor({
          color: color
        });
      }
    });
}

/**
 * 获取最近24h行情概要
 * @param coin { String } 自选币种
 */
const setBadge = coin => {
  if (coin) {
    if (TIMER) {
      clearInterval(TIMER);
      TIMER = null;
    }
    const item = localStorage.getItem("upsColor");
    const upsColor = item === null ? true : item === "true";
    // 立即请求一次
    getMarket(coin, upsColor);
    TIMER = setInterval(() => {
      getMarket(coin, upsColor);
    }, 5000);
  }
};

const initBadge = () => {
  // console.log("初始化 initBadge");
  const coin = localStorage.getItem("badgeCoin") || "";
  if (coin) {
    setBadge(coin);
  }
};

// 初始化
initBadge();
