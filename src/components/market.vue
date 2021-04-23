<template>
  <div
    class="index pl15 pt15 pr15"
    :class="isDev ? 'pb15' : ''"
    :style="indexStyle"
  >
    <!--币种选择器-->
    <div class="flex ac mt5">
      <coin-select v-if="coins.length" :coin.sync="selectedCoin"></coin-select>
      <a-button class="ml10" @click="addOptional(selectedCoin)">{{
        i18n.addOptional || "添加自选"
      }}</a-button>
    </div>

    <!--功能按钮-->
    <div class="flex ac mt15">
      <custom-columns
        style="height: 18px;"
        :columns="columns"
        @update="_setTableKeys"
        v-model="selectedColumns"
      ></custom-columns>

      <a-tooltip>
        <template slot="title">
          {{ i18n.resetWidths || "恢复表格默认列宽度" }}
        </template>
        <a-icon
          class="mr20 pointer f18"
          @click="resetWidth()"
          type="column-width"
        />
      </a-tooltip>
    </div>

    <!--行情表格-->
    <div class="mt15">
      <a-table
        :loading="loading"
        :columns="selectedColumns"
        :dataSource="marketList"
        :rowKey="record => record.id"
        :pagination="false"
        @change="onTableChange"
        :components="components"
        bordered
      >
        <template slot="ups" slot-scope="value, row">
          <a-tag
            :color="
              row.ups >= 0
                ? upsColor
                  ? 'volcano'
                  : 'green'
                : upsColor
                ? 'green'
                : 'volcano'
            "
          >
            {{ `${row.ups > 0 ? "+" + row.ups : row.ups}%` }}
          </a-tag>
        </template>
        <template slot="badge" slot-scope="badge, row">
          <a-switch
            :checked-children="i18n.switchOn || '开'"
            :un-checked-children="i18n.switchOff || '关'"
            :checked="badge"
            @change="badgeChange($event, row)"
          />
        </template>
        <div slot="action" slot-scope="value, row">
          <a-tooltip>
            <template slot="title">
              {{ i18n.cancelOptional || "取消自选" }}
            </template>
            <a-icon
              class="pointer"
              @click="delOptional(row)"
              type="star"
              :style="{ fontSize: '18px' }"
              theme="filled"
            />
          </a-tooltip>
          <a-tooltip>
            <template slot="title">
              {{ i18n.stick || "置顶" }}
            </template>
            <a-icon
              class="pointer ml5"
              @click="stickOptional(row)"
              type="vertical-align-top"
              :style="{ fontSize: '20px' }"
            />
          </a-tooltip>
        </div>
      </a-table>
    </div>
  </div>
</template>

<script>
import NP from "number-precision";
import CoinSelect from "@components/common/coinSelect";
import { formatNum, deBonce, throttle, blob2json } from "@/tools";
import { mapActions, mapMutations, mapState, mapGetters } from "vuex";
import CustomColumns from "@components/common/customColumns";

// 当用户的自选为空时，使用内置默认的自选
const DEFAULTCOINS = ["btc", "eth", "ltc", "ht"];
// 默认的列宽度数值
const DEFAULTWIDTHS = [
  { dataIndex: "name", width: 50 },
  { dataIndex: "ups", width: 80 },
  { dataIndex: "close", width: 80 },
  { dataIndex: "low", width: 80 },
  { dataIndex: "high", width: 80 },
  { dataIndex: "open", width: 80 },
  { dataIndex: "vol", width: 80 },
  { dataIndex: "amount", width: 50 },
  { dataIndex: "count", width: 50 },
  { dataIndex: "badge", width: 80 },
  { dataIndex: "action", width: 80 }
];

NP.enableBoundaryChecking(false);

export default {
  name: "market",
  components: { CustomColumns, CoinSelect },
  data() {
    this.components = {
      header: {
        cell: (h, props, children) => {
          const { key, ...restProps } = props;
          // console.log("ResizeableTitle：", key);
          const col = this.selectedColumns.find(col => {
            const k = col.dataIndex || col.key;
            return k === key;
          });

          if (!col || !col.width) {
            return h("th", { ...restProps }, [...children]);
          }

          const dragProps = {
            key: col.dataIndex || col.key,
            class: "table-draggable-handle",
            attrs: {
              w: 10,
              x: col.width,
              z: 1,
              axis: "x",
              draggable: true,
              resizable: false
            },
            on: {
              dragging: x => {
                col.width = Math.max(x, 1);
                // 每次拖拽变更后的将width数值缓存到本地，下次直接使用
                deBonce(() => {
                  // const list = JSON.parse(JSON.stringify(this.tableWidths));
                  // list.some(item => {
                  //   if (item.dataIndex === key) {
                  //     item
                  //   }
                  // })
                  const arr = this.selectedColumns.map(item => {
                    return {
                      dataIndex: item.dataIndex,
                      width: item.width
                    };
                  });
                  this._setTableWidths(arr);
                }, 350);
                // 保存拖拽后width
              }
            }
          };
          const drag = h("vue-draggable-resizable", { ...dragProps });
          return h("th", { ...restProps, class: "resize-table-th" }, [
            ...children,
            drag
          ]);
        }
      }
    };
    return {
      dataPool: {}, // 数据缓冲池
      isDev: process.env.NODE_ENV === "development",
      checkedList: [], // 选择的字段列表
      loading: true, // 是否加载中
      selectedCoin: [], // 选择的币种  添加自选

      wsUrl: process.env.VUE_APP_WS,
      lockReconnect: false, // 不进行重连
      maxReconnect: 5, // 最大重连次数，若连接失败
      socket: null, // websocket实例

      optionalCoins: [], // 当前自选的币种列表（包含缓存）
      marketList: [], // 自选的币种行情数据
      selectedColumns: [],
      defColumns: [
        {
          title: "Coin",
          align: "center",
          dataIndex: "name",
          checked: true, // 是否默认勾选
          checkDisabled: true, // 是否默认禁用
          customRender: val => {
            return val.toUpperCase();
          },
          i18nKey: "colCoin"
        },
        {
          title: "涨跌幅",
          align: "left",
          dataIndex: "ups",
          ellipsis: false,
          checked: true,
          checkDisabled: false,
          scopedSlots: { customRender: "ups" },
          sorter: (a, b) => a.ups - b.ups,
          i18nKey: "colUps"
        },
        {
          title: "最新",
          align: "left",
          dataIndex: "close",
          width: 80,
          checked: true,
          checkDisabled: false,
          customRender: val => {
            return `$${val}`;
          },
          sorter: (a, b) => a.close - b.close,
          i18nKey: "colClose"
        },
        {
          title: "最低",
          align: "left",
          dataIndex: "low",
          ellipsis: true,
          checked: false,
          checkDisabled: false,
          customRender: val => {
            return `$${val}`;
          },
          sorter: (a, b) => a.low - b.low,
          i18nKey: "colLow"
        },
        {
          title: "最高",
          align: "left",
          dataIndex: "high",
          ellipsis: true,
          checked: false,
          checkDisabled: false,
          customRender: val => {
            return `$${val}`;
          },
          sorter: (a, b) => a.high - b.high,
          i18nKey: "colHigh"
        },
        {
          title: "开盘",
          align: "left",
          dataIndex: "open",
          ellipsis: true,
          checked: false,
          checkDisabled: false,
          sorter: (a, b) => a.open - b.open,
          i18nKey: "colOpen"
        },
        {
          title: "成交额",
          align: "left",
          dataIndex: "vol",
          ellipsis: true,
          checked: false,
          checkDisabled: false,
          customRender: vol => {
            const unit = 100000000;
            const val =
              vol > 10000
                ? NP.round(NP.divide(vol, unit), 2) + "亿"
                : NP.round(vol, 2);
            return `￥${val}`;
          },
          sorter: (a, b) => a.vol - b.vol,
          i18nKey: "colVol"
        },
        {
          title: "成交量",
          align: "left",
          dataIndex: "amount",
          ellipsis: true,
          checked: false,
          checkDisabled: false,
          customRender: val => formatNum(val),
          sorter: (a, b) => a.amount - b.amount,
          i18nKey: "colAmount"
        },
        {
          title: "成交笔数",
          align: "left",
          dataIndex: "count",
          ellipsis: true,
          checked: false,
          checkDisabled: false,
          customRender: val => formatNum(val),
          sorter: (a, b) => a.count - b.count,
          i18nKey: "colCount"
        },
        {
          title: "角标",
          align: "center",
          dataIndex: "badge",
          scopedSlots: { customRender: "badge" },
          checked: true,
          checkDisabled: true,
          i18nKey: "colBadge"
        },
        {
          title: "操作",
          align: "center",
          dataIndex: "action",
          ellipsis: true,
          scopedSlots: { customRender: "action" },
          checked: true,
          checkDisabled: true,
          i18nKey: "colOperation"
        }
      ]
    };
  },
  computed: {
    ...mapState({ coins: state => state.coinList }),
    ...mapState([
      "tableKeys",
      "myCoinList",
      "stickList",
      "upsColor",
      "badgeCoin",
      "sortConfig",
      "userLang",
      "tableWidths",
      "openType"
    ]),
    ...mapGetters(["i18n"]),
    // 所有列数据 包含未展示的
    columns() {
      const columns = [];
      // 初始化时默认使用上次的排序
      // 从缓存中里获取上次排序的columns dataIndex字段
      const { order, columnKey } = this.sortConfig;
      this.defColumns.forEach(item => {
        item.title = this.i18n[item.i18nKey];
        item.sortOrder = item.dataIndex === columnKey ? order : false;
        columns.push(item);
      });
      return columns;
    },
    indexStyle() {
      const arr = [];
      DEFAULTWIDTHS.forEach(item => {
        if (this.selectedColumns.some(i => i.dataIndex === item.dataIndex)) {
          arr.push(item);
        }
      });
      let num = arr.reduce((prev, cur) => {
        return cur.width + prev;
      }, 0);
      num = num + 30; // +30 是把左右内边距算进去
      num = num > 800 ? 800 : num;
      num = num < 420 ? 420 : num;
      return {
        // 根据表格字段动态设置页面的width
        width: this.openType > 0 ? "100%" : `${num}px`
      };
    }
  },
  created() {
    this._getCoinList();
    this._initCache().then(() => {
      this.init();
    });
  },
  methods: {
    ...mapMutations([
      "_setMyCoinList",
      "_setTableKeys",
      "_setStickList",
      "_setBadgeCoin",
      "_setSortConfig",
      "_setTableWidths"
    ]),
    ...mapActions(["_getCoinList", "_initCache"]),
    init() {
      this.selectedColumns = this.columns.filter(item => item.checked);
      // 列宽度数值初始化处理，先判断缓存中有没有，没有就使用默认的配置
      const widths =
        this.tableWidths.length > 0 ? this.tableWidths : DEFAULTWIDTHS;
      this.defColumns.forEach(item => {
        widths.some(wItem => {
          if (wItem.dataIndex === item.dataIndex) {
            item.width = wItem.width;
          }
        });
      });
      // 初始化选择的字段列表
      // 先赋值内置的，后面可能有更新的情况
      this.columns.forEach(item => {
        if (item.checked) {
          this.checkedList.push(item.dataIndex);
        }
      });
      // 再从缓存中获取
      if (this.tableKeys.length) {
        this.tableKeys.forEach(item => {
          // 去重添加
          if (!this.checkedList.some(cItem => cItem === item)) {
            // 从倒数第三个个位置插入 角标和操作 固定在最右边
            this.checkedList.splice(this.checkedList.length - 3, 0, item);
          }
        });
      }
      this.getOptional();
    },
    // 恢复默认列宽度
    resetWidth() {
      this.defColumns.forEach(item => {
        DEFAULTWIDTHS.some(wItem => {
          if (wItem.dataIndex === item.dataIndex) {
            item.width = wItem.width;
          }
        });
      });
      const arr = this.selectedColumns.map(item => {
        return {
          dataIndex: item.dataIndex,
          width: item.width
        };
      });
      this._setTableWidths(arr);
    },
    // 表格排序变化等
    onTableChange(pagination, filters, sorter) {
      const { order, columnKey } = sorter;
      // console.log(sorter, order, columnKey);
      if (order) {
        this._setSortConfig({
          order,
          columnKey
        });
      } else {
        this._setSortConfig({});
      }
    },
    // 保存自选到本地localStorage
    addOptional(list = []) {
      let data = JSON.parse(JSON.stringify(this.myCoinList));
      // 去重添加
      list.forEach(item => {
        const isHave = this.myCoinList.some(dItem => dItem === item);
        if (!isHave) {
          data.push(item);
        }
      });
      this.optionalCoins = data;
      this._setMyCoinList(data);
      this._setStickList(data);
      this.selectedCoin = []; // 清空选择框
      this.getOptional();
    },
    // 从缓存中获取自选的币种
    getOptional() {
      // 从缓存中获取自选的币种
      this.optionalCoins = JSON.parse(JSON.stringify(this.myCoinList));
      // 用户刚安装，没有自选时，使用内置默认的自选
      if (this.optionalCoins.length === 0) {
        this.optionalCoins = DEFAULTCOINS;
        // 并缓存到本地
        this._setMyCoinList(DEFAULTCOINS);
      }
      // 用户刚安装
      if (this.stickList.length === 0) {
        // 使用默认的并缓存到本地
        this._setStickList(DEFAULTCOINS);
      }
      const marketList = [];
      // 组合成table需要的数据格式
      this.optionalCoins.forEach(item => {
        // 排序index
        const index = this.stickList.findIndex(sItem => sItem === item);
        marketList.push({
          name: item,
          amount: 0,
          open: 0,
          close: 0,
          high: 0,
          id: item,
          count: 0,
          low: 0,
          vol: 0,
          ups: 0,
          index,
          badge: this.badgeCoin === item
        });
      });
      // index小的排到前面
      marketList.sort((a, b) => a.index - b.index);
      this.marketList = marketList;

      this.initWebSocket();
    },
    // 取消自选
    delOptional(row) {
      const tIndex = this.marketList.findIndex(item => item.name === row.name);
      this.marketList.splice(tIndex, 1);
      // 从本地获取自选的币种
      this.optionalCoins.some((item, index) => {
        if (row.name === item) {
          this.optionalCoins.splice(index, 1);
          return true;
        }
        return false;
      });
      this._setMyCoinList(this.optionalCoins);
      // 更新排序
      const list = JSON.parse(JSON.stringify(this.stickList));
      const mIndex = list.findIndex(item => item === row.name);
      list.splice(mIndex, 1);
      this._setStickList(list);
      // 如果设置了角标，则停止角标提醒
      if (row.badge === true) {
        this._setBadgeCoin("");
        // 通知后台js显示角标
        chrome.runtime.sendMessage({
          type: "refreshBadge"
        });
      }
    },
    // 置顶自选
    stickOptional(row) {
      let list = JSON.parse(JSON.stringify(this.stickList));

      const index = this.stickList.findIndex(item => item === row.id);
      // 删除原来的
      list.splice(index, 1);
      // 插入到第一位
      list.splice(0, 0, row.id);
      // 更新缓存
      this._setStickList(list);
      // 更新排序index值
      this.marketList.forEach(item => {
        item.index = list.findIndex(sItem => sItem === item.id);
      });
      // 更新排序
      this.marketList.sort((a, b) => a.index - b.index);
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
      if (this.socket && this.marketList.length) {
        this.marketList.forEach(item => {
          this.getKline(item.name);
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
          const coinItem = this.marketList.filter(
            item => item.name === coinName
          )[0];
          if (!coinItem || !coinItem.close) {
            // console.log("初始化更新", coinName);
            this.updateTableData(res, coinName);
          }
          // 节流 限制1000ms内统一批量更新一次。
          throttle(() => {
            // console.log("批量更新数据");
            Object.keys(this.dataPool).forEach(item => {
              this.updateTableData(this.dataPool[item], item);
            });
          }, 1000);
        }
      });
    },
    websocketClose(e) {
      console.log("connection closed:", e);
      this.reconnect();
    },
    /**
     * 更新表格数据
     * @param res { Object } 币种的更新数据包
     * @param coinName { String } 币种名称
     **/
    updateTableData(res, coinName) {
      // console.log(res, coinName);
      // 更新数据
      this.marketList.some(item => {
        if (item.name === coinName) {
          const {
            amount,
            open,
            close,
            high,
            // id,
            count,
            low,
            vol
          } = res.tick;
          item.amount = amount;
          item.open = open;
          item.close = close;
          item.high = high;
          item.id = coinName;
          item.count = count;
          item.low = low;
          item.vol = vol;
          item.badge = this.badgeCoin === coinName;
          // 计算涨跌百分比
          // 最新价 - 开盘价 / 开盘价 = 涨跌百分比
          item.ups = NP.times(
            NP.round(NP.divide(NP.minus(close, open), open), 4),
            100
          );
          return true;
        }
        return false;
      });
      // index小的排到前面
      this.marketList.sort((a, b) => a.index - b.index);
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
    },
    /**
     * 角标显示的币种更新
     * @param val
     * @param row
     */
    badgeChange(val, row) {
      // console.log(val, row);
      this.marketList.forEach(item => {
        // 关闭其他的
        if (item.badge === true) {
          item.badge = false;
        }
        if (item.name === row.name) {
          item.badge = val;
        }
      });
      this._setBadgeCoin(val ? row.name : "");
      // 通知后台js显示角标
      chrome.runtime.sendMessage({
        type: "refreshBadge"
      });
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
.index {
  overflow: auto;
  min-height: 300px;
  max-height: 600px;
  transition: all 0.3s;
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    padding: 5px;
  }
}
.resize-table-th {
  position: relative;
}
.table-draggable-handle {
  height: 100% !important;
  left: auto !important;
  right: -5px;
  cursor: col-resize;
  touch-action: none;
  border: none;
}
</style>
<style lang="less" scoped>
.index {
  /deep/ .ant-switch {
    background-color: #39c38c;
  }
  /deep/ .ant-switch-checked {
    background-color: #ff704b;
  }
}
</style>
