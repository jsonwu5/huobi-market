<template>
  <!-- 收益统计 -->
  <div
    class="earnings pl15 pt15 pr15"
    :style="earningsStyles"
    :class="isDev ? 'pb15' : ''"
  >
    <div class="flex ac">
      <a-tooltip>
        <template slot="title">导入订单明细</template>
        <a-upload
          accept=".csv"
          name="file"
          :multiple="false"
          :before-upload="uploadConfig"
          :show-upload-list="false"
        >
          <a-icon class="mr20 pointer f18" type="upload" />
        </a-upload>
      </a-tooltip>
      <custom-columns v-model="selectedColumns" :columns="columns">
        <a-button class="mb5 mr20">自定义列</a-button>
      </custom-columns>
    </div>
    <div class="mt10">
      <a-table
        :loading="loading"
        :columns="selectedColumns"
        :dataSource="records"
        :rowKey="record => record.id"
        :pagination="false"
        bordered
      >
        <template slot="gains" slot-scope="value, row">
          <a-tag :color="colorHandel(row.gains)">
            <span>{{ `$${NP.round(row.gains, 2)}` }}</span>
          </a-tag>
        </template>
        <template slot="todayGains" slot-scope="value, row">
          <a-tag :color="colorHandel(row.todayGains)">
            <span>{{ `$${NP.round(row.todayGains, 2)}` }}</span>
          </a-tag>
        </template>
        <template slot="todayGainsUps" slot-scope="value, row">
          <a-tag :color="colorHandel(row.todayGainsUps)">
            <span v-if="row.todayGainsUps">{{
              `${
                row.todayGainsUps > 0
                  ? "+" + row.todayGainsUps
                  : row.todayGainsUps
              }%`
            }}</span>
            <span v-else>0%</span>
          </a-tag>
        </template>
        <template slot="gainsUps" slot-scope="value, row">
          <a-tag :color="colorHandel(row.gainsUps)">
            <span v-if="row.gainsUps">{{
              `${row.gainsUps > 0 ? "+" + row.gainsUps : row.gainsUps}%`
            }}</span>
            <span v-else>0%</span>
          </a-tag>
        </template>
        <a-space
          slot="action"
          align="center"
          slot-scope="value, row"
          v-if="value !== false"
        >
          <a-popconfirm
            placement="left"
            title="确认要删除该币种分析数据吗"
            :ok-text="i18n.affirm || '确认'"
            :cancel-text="i18n.cancel || '取消'"
            @confirm="deleteCoinData(row)"
          >
            <a-icon
              class="pointer"
              type="delete"
              :style="{ fontSize: '18px', marginTop: '2px' }"
              theme="filled"
            />
          </a-popconfirm>
          <span class="pointer" @click="openDetails(row)">详情</span>
        </a-space>
      </a-table>
    </div>

    <record v-if="visible" v-model="visible" :coin="coinName"></record>
  </div>
</template>

<script>
import NP from "number-precision";
import { mapGetters, mapState, mapMutations, mapActions } from "vuex";
import { blob2json, throttle } from "@tools";
import Record from "@components/common/record";
import CustomColumns from "@components/common/customColumns";

export default {
  name: "earnings",
  components: { Record, CustomColumns },
  data() {
    return {
      NP,
      visible: false,
      coinName: "",
      isDev: process.env.NODE_ENV === "development",
      loading: false,

      wsUrl: process.env.VUE_APP_WS,
      lockReconnect: false, // 连接失败不进行重连
      maxReconnect: 5, // 最大重连次数，若连接失败
      socket: null, // websocket实例
      dataPool: {}, // 数据缓冲池
      analysis: {}, // 更新需要使用到的数据 每N秒更新一次

      selectedColumns: [],
      columns: [
        {
          checked: true, // 是否默认勾选
          checkDisabled: true, // 是否默认禁用
          title: "Coin",
          align: "center",
          dataIndex: "name",
          i18nKey: "colCoin"
        },
        {
          checked: true,
          checkDisabled: false,
          title: "最新价",
          align: "left",
          dataIndex: "close",
          width: 80,
          customRender: val => {
            return val !== "-" ? `$${val}` : val;
          },
          sorter: (a, b) => a.close - b.close,
          i18nKey: "colClose"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "数量",
          align: "left",
          dataIndex: "coinCount",
          customRender: val => {
            return val !== "-" ? `${NP.round(val, 2)}` : val;
          },
          sorter: (a, b) => a.coinCount - b.coinCount,
          i18nKey: "colCoinCount"
        },
        {
          checked: false, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "买入均价",
          align: "left",
          dataIndex: "averagePrice",
          customRender: val => {
            // TODO 按币价来计算显示几位小数
            return val !== "-" ? `$${NP.round(val, 2)}` : val;
          },
          sorter: (a, b) => a.averagePrice - b.averagePrice,
          i18nKey: "colAveragePrice"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "成本价",
          align: "left",
          dataIndex: "costPrice",
          customRender: val => {
            // TODO 按币价来计算显示几位小数
            return val !== "-" ? `$${NP.round(val, 2)}` : val;
          },
          sorter: (a, b) => a.costPrice - b.costPrice,
          i18nKey: "colCostPrice"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "持有价值",
          align: "left",
          dataIndex: "totalNetValue",
          customRender: val => {
            return `$${NP.round(val, 2)}`;
          },
          sorter: (a, b) => a.totalNetValue - b.totalNetValue,
          i18nKey: "colTotalNetValue"
        },
        {
          checked: false, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "总成本",
          align: "left",
          dataIndex: "buyAmount",
          customRender: val => {
            return val !== "-" ? `$${NP.round(val, 2)}` : val;
          },
          sorter: (a, b) => a.buyAmount - b.buyAmount,
          i18nKey: "colBuyAmount"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "总收益",
          align: "left",
          dataIndex: "gains",
          // customRender: val => {
          //   return `$${NP.round(val, 2)}`;
          // },
          scopedSlots: { customRender: "gains" },
          sorter: (a, b) => a.gains - b.gains,
          i18nKey: "colGains"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "今日收益",
          align: "left",
          dataIndex: "todayGains",
          // customRender: val => {
          //   return `$${NP.round(val, 2)}`;
          // },
          scopedSlots: { customRender: "todayGains" },
          sorter: (a, b) => a.todayGains - b.todayGains,
          i18nKey: "colTodayGains"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "涨跌幅",
          align: "left",
          dataIndex: "todayGainsUps",
          scopedSlots: { customRender: "todayGainsUps" },
          sorter: (a, b) => a.todayGainsUps - b.todayGainsUps,
          i18nKey: "colTodayGainsUps"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "总收益率",
          align: "left",
          dataIndex: "gainsUps",
          scopedSlots: { customRender: "gainsUps" },
          sorter: (a, b) => a.gainsUps - b.gainsUps,
          i18nKey: "colGainsUps"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: true, // 是否默认禁用
          title: "操作",
          align: "center",
          dataIndex: "action",
          scopedSlots: { customRender: "action" },
          i18nKey: "colOperation"
        }
      ]
    };
  },
  computed: {
    ...mapState(["upsColor", "buySellRecords", "manifest", "openType"]),
    ...mapGetters(["i18n"]),
    earningsStyles() {
      return {
        height: this.visible ? "530px" : "auto",
        width: this.openType > 0 ? "100%" : "800px"
      };
    },
    records() {
      let list = [];
      const symbol = {};
      this.buySellRecords.forEach(item => {
        const key = item.symbol.split("/")[0];
        if (!Object.prototype.hasOwnProperty.call(symbol, key)) {
          symbol[key] = [];
        }
        symbol[key].push(item);
      });
      // item = 币种名称（OXT） 是大写
      Object.keys(symbol).forEach(item => {
        const arr = symbol[item];
        // {
        //      时间: "created",
        //     交易类型: "type",
        //     交易对: "symbol",
        //     方向: "role",
        //     价格: "price",
        //     数量: "amount",
        //     成交额: "volume",
        //     手续费: "points"
        // }
        const buy = arr.filter(a => a.role === "买入");
        const sale = arr.filter(a => a.role === "卖出");
        // 币种最新开盘价格数据包
        const res = Object.prototype.hasOwnProperty.call(this.analysis, item)
          ? this.analysis[item]
          : {};
        // 币种最新价
        const coinClose = res && res.tick ? res.tick.close : 0;
        // 币种开盘价
        const coinOpen = res && res.tick ? res.tick.open : 0;

        // N次买入的币总数量（已减去支付的手续费数量）
        const buyCount = buy.reduce((a, b) => NP.plus(a, b.realAmount), 0);
        // N次买入总金额
        const buyAmount = buy.reduce((a, b) => NP.plus(a, b.volume), 0);

        // N次卖出的币总数量
        const saleCount = sale.reduce((a, b) => NP.plus(a, b.realAmount), 0);
        // N次卖出总金额（已减去支付的手续费金额）
        const saleAmount = sale.reduce((a, b) => NP.plus(a, b.realVolume), 0);
        // N次卖出总金额
        const saleVolume = sale.reduce((a, b) => NP.plus(a, b.volume), 0);
        // 卖出均价 = N次卖出总金额 / N次卖出总数量
        const saleCostPrice = NP.divide(saleVolume, saleCount);

        // 买入均价（成本价） = N次买入的币总数量（已减去支付的手续费数量） / N次买入总数量
        const buySveragePrice = NP.divide(buyAmount, buyCount);

        // 持有总量 = N次买入的币总数量 - N次卖出的币总数量
        const coinCount = NP.minus(buyCount, saleCount);
        // 成本价 = （买入金额 - 盈亏金额）/ 持币数量
        const costPrice = NP.divide(NP.minus(buyAmount, saleVolume), coinCount);
        // 当前持币总价值 = 持有总量 * 币价
        const totalNetValue = NP.times(coinCount, coinClose);
        // 总收益 = 当前持币总价值 + 卖出的总金额 - N次买入总金额(总成本)
        const gains = NP.minus(NP.plus(totalNetValue, saleAmount), buyAmount);
        // 收益估算金额 当天的盈利金额 = (最新价 - 开盘价) * 持有数量
        const todayGains = NP.times(NP.minus(coinClose, coinOpen), coinCount);
        // 收益日涨跌幅 = (最新价 - 成本价) / 成本价 - (开盘价 - 成本价) / 成本价
        let todayGainsUps = NP.minus(
          NP.divide(NP.minus(coinClose, costPrice), costPrice),
          NP.divide(NP.minus(coinOpen, costPrice), costPrice)
        );
        todayGainsUps = NP.times(NP.round(todayGainsUps, 4), 100);
        // 单个币种总收益率 = 总收益 / N次买入总金额
        let gainsUps = NP.round(NP.divide(gains, buyAmount), 4);
        gainsUps = NP.times(gainsUps, 100);

        list.push({
          id: item,
          close: coinClose,
          tick: res.tick,
          name: item,
          // 持有总量
          coinCount,
          // 买入均价
          averagePrice: buySveragePrice,
          // 成本价
          costPrice,
          // 持有价值
          totalNetValue,
          // 总收益
          gains,
          // 持币总收益率
          gainsUps,
          // 收益估算金额 当天的盈利金额
          todayGains,
          // 收益日涨跌幅
          todayGainsUps,
          // 卖出均价
          saleCostPrice,
          // 买入总成本
          buyAmount
        });
      });

      const totalAllCost = list.reduce((a, b) => NP.plus(a, b.buyAmount), 0);
      const allGains = list.reduce((a, b) => NP.plus(a, b.gains), 0);
      const totalTodayGains = list.reduce(
        (a, b) => NP.plus(a, b.todayGains),
        0
      );
      // 所有币种数据统计
      list.push({
        id: "total",
        name: "合计",
        close: "-",
        coinCount: "-",
        costPrice: "-",
        averagePrice: "-",
        // 总价值
        totalNetValue: list.reduce((a, b) => NP.plus(a, b.totalNetValue), 0),
        // 总收益
        gains: allGains,
        // 今日所有币种收益率涨跌幅 = 今日总收益 / 总成本
        todayGainsUps: NP.times(
          NP.round(NP.divide(totalTodayGains, totalAllCost), 4),
          100
        ),
        // 总收益率 = 总收益 / 总净成本
        gainsUps: NP.times(NP.round(NP.divide(allGains, totalAllCost), 4), 100),
        // 今日收益
        todayGains: totalTodayGains,
        saleCostPrice: "-",
        // 总成本
        buyAmount: list.reduce((a, b) => NP.plus(a, b.buyAmount), 0),
        action: false
      });
      return list;
    }
  },
  created() {
    this._initCache().then(() => {
      this.initWebSocket();
      this.selectedColumns = this.columns.filter(item => item.checked);
    });
  },
  methods: {
    ...mapMutations(["_setBuySellRecords"]),
    ...mapActions(["_deleteRecords", "_initCache"]),
    colorHandel(value) {
      return value >= 0
        ? this.upsColor
          ? "volcano"
          : "green"
        : this.upsColor
        ? "green"
        : "volcano";
    },
    openDetails(row) {
      this.coinName = row.name;
      this.visible = true;
    },
    deleteCoinData(row) {
      this._deleteRecords(row.name);
      this.$message.success("删除成功");
    },
    // 导入成交明细
    uploadConfig(file) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = event => {
        if (event.target.result) {
          this._setBuySellRecords(this.csv2Json(event.target.result));
          // 循环订阅每个币种的主题消息d
          if (this.socket && this.records.length) {
            this.records.forEach(item => {
              this.getKline(item.name.toLowerCase());
            });
          }
        }
      };
      return false;
    },
    // 转成JSON数据格式
    csv2Json(data) {
      if (!data && !data.length) {
        console.error("data is undefined");
        return;
      }
      // 过滤掉空值 最后一条可能是空值
      const rowsArr = data.split(/\n/).filter(item => item.length);
      const keys = {
        时间: "created",
        交易类型: "type",
        交易对: "symbol",
        方向: "role",
        价格: "price", // Number
        数量: "amount", // Number
        成交额: "volume", // Number
        手续费: "points" // 0.62751920OXT
      };
      const columnKeys = []; // 列字段
      const list = [];
      // 删除第一条并返回删除的数据
      rowsArr
        .shift()
        .split(",")
        .forEach(kItem => {
          const haveKey = Object.prototype.hasOwnProperty.call(
            keys,
            kItem.replace(/"/g, "")
          );
          // ""时间"" 去掉里面的双引号
          columnKeys.push(haveKey ? keys[kItem.replace(/"/g, "")] : null);
        });
      // 2021-01-12 09:18:35,币币交易,USDT/HUSD,卖出,1.0003,310.0000,310.09300000,0.62018600HUSD,
      // 转换成
      // {
      // amount: 310
      // created: "2021-01-12 09:18:35"
      // points: "0.62018600HUSD"
      // price: 1.0003
      // role: "卖出"
      // symbol: "USDT/HUSD"
      // type: "币币交易"
      // volume: 310.093
      // }
      rowsArr.forEach(item => {
        const obj = {};
        item.split(",").forEach((rItem, rIndex) => {
          if (columnKeys[rIndex]) {
            obj[columnKeys[rIndex]] = rItem;
            // symbol: "USDT/HUSD" 转成小写 symbol: "usdt/husd"
            if (columnKeys[rIndex] === "symbol") {
              obj[columnKeys[rIndex]] = rItem.toLowerCase();
            }
          }
        });
        list.push(obj);
      });
      list.forEach(item => {
        item.price = Number(item.price); // “0.03906” → 0.03906
        item.amount = Number(item.amount); // “493.5266” → 493.5266
        item.volume = Number(item.volume); // “19.27714899” → 19.27714899
        item.coin = item.symbol.split("/")[0];
        let value = item.points;
        // 手续费单位 去掉所有数字和小数点并转成小写
        if (value) {
          item.pointsUnit = value
            .replace(/\d+/g, "")
            .replace(/./, "")
            .toLowerCase(); // 0.62751920OXT = oxt
          item.points = parseFloat(value); // 格式化手续费 0.00195049HT = 0.00195049
        }
        // 处理买入手续费问题
        // 如果支付的手续费币种跟购买的币种一样 eg：LTC/USDT 手续费 xxx LTC
        if (item.role === "买入" && item.pointsUnit === item.coin) {
          // 实际数量 = 交易数量 - 手续费数量
          item.realAmount = NP.minus(item.amount, item.points);
        } else {
          item.realAmount = item.amount;
        }
        // console.log(
        //   `买入 手续费币种：${item.pointsUnit},交易对：${item.symbol},realAmount：${item.realAmount}， amount：${item.amount}, points：${item.points}`
        // );
        // 处理卖出手续费问题
        // 如果支付的手续费币种跟卖出的交易对一样 eg：LTC/USDT 手续费 xxx USDT
        if (
          item.role === "卖出" &&
          item.pointsUnit === item.symbol.split("/")[1]
        ) {
          // 实际成交金额 = 交易成交金额 - 手续费金额
          item.realVolume = NP.minus(item.volume, item.points);
        } else {
          item.realVolume = item.volume;
        }
        // console.log(
        //   `卖出 手续费币种：${item.pointsUnit},交易对：${item.symbol},realVolume：${item.realVolume}， amount：${item.volume}, points：${item.points}`
        // );
      });
      return list;
    },

    reconnect() {
      console.log("尝试重连");
      if (this.lockReconnect || this.maxReconnect <= 0) {
        return;
      }
      setTimeout(() => {
        // this.maxReconnect-- // 不做限制 连不上一直重连
        this.initWebSocket();
      }, 10 * 1000);
    },
    // 初始化websocket
    initWebSocket() {
      try {
        if ("WebSocket" in window) {
          this.loading = true;
          this.socket = new WebSocket(this.wsUrl);
        } else {
          console.log("您的浏览器不支持websocket");
        }
        this.socket.onopen = this.websocketOnOpen;
        this.socket.onerror = this.websocketOnError;
        this.socket.onmessage = this.websocketOnMessage;
        this.socket.onclose = this.websocketClose;
      } catch (e) {
        this.loading = false;
        this.reconnect();
      }
    },
    websocketOnOpen() {
      this.loading = false;
      console.log("WebSocket连接成功", this.socket.readyState);
      // 循环订阅每个币种的主题消息d
      if (this.socket && this.records.length) {
        this.records.forEach(item => {
          this.getKline(item.name.toLowerCase());
        });
      }
    },
    websocketOnError(e) {
      console.log("WebSocket连接发生错误：", e);
      this.reconnect();
    },
    // 接收数据并处理
    websocketOnMessage(e) {
      blob2json(e.data, res => {
        // console.log("接收到的数据：", res);
        if (res.ping) {
          // 回应心跳包
          this.socket.send(JSON.stringify(res));
        }
        if (res.ch) {
          // 解析币种
          const coinName = res.ch.split(".")[1].split("usdt")[0];
          // 数据缓存到池子中
          this.dataPool[coinName] = res;
          // 初始化时立即更新一次
          const coinItem = this.records.filter(
            item => item.name === coinName
          )[0];
          if (!coinItem || !coinItem.close) {
            // console.log("初始化更新", coinName);
            this.analysis[coinName] = res;
          }
          // 节流 限制1000ms内统一批量更新一次。
          throttle(() => {
            // console.log("批量更新数据");
            this.analysis = JSON.parse(JSON.stringify(this.dataPool));
          }, 1000);
        }
      });
    },
    websocketClose(e) {
      console.log("connection closed:", e);
      this.reconnect();
    },
    /**
     * 获取K线行情数据
     * API: https://huobiapi.github.io/docs/spot/v1/cn/#k-2
     * @param coin { String } 自选币种名称
     * @param period { String } K线周期	1min, 5min, 15min, 30min, 60min, 4hour, 1day, 1mon, 1week, 1year
     */
    getKline(coin, period = "1day") {
      //
      let data = {
        sub: `market.${coin}usdt.kline.${period}`,
        id: "id1"
      };

      this.socket.send(JSON.stringify(data));
    }
  },
  // 页面注销，关闭websocket
  destroyed() {
    this.lockReconnect = true;
    this.socket.close();
  }
};
</script>

<style lang="less">
.earnings {
  overflow-y: auto;
  min-height: 300px;
  transition: all 0.3s;
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    padding: 5px;
  }
  .ant-space-item {
    display: flex;
    align-content: center;
    justify-content: center;
  }
}
</style>
