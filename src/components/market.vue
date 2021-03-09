<template>
  <div
    class="index pl15 pt15 pr15 pb15"
    :class="isDev ? 'pb30' : 'pb15'"
    :style="indexStyle"
  >
    <a-space>
      <span class="bold f16">{{ manifest.name }}</span>
      <span>当前版本:{{ manifest.version }}</span>
      <span v-if="false" @click="feedback" class="pointer">吐个槽</span>
      <a-button class="githubBtn flex ac" @click="goGithub()">
        <svg
          class="githubIcon"
          height="24"
          viewBox="0 0 16 16"
          version="1.1"
          width="24"
          aria-hidden="true"
        >
          <path
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
          /></svg
        ><span class="ml5">源代码</span></a-button
      >
    </a-space>
    <div class="flex ac mt5">
      <coin-select v-if="coins.length" :coin.sync="selectedCoin"></coin-select>
      <a-button class="ml10" @click="addOptional(selectedCoin)"
        >添加自选</a-button
      >
    </div>
    <div class="flex ac mt15">
      <div class="mr15">
        <a-switch
          checked-children="红涨"
          un-checked-children="绿涨"
          v-model="upsColor"
        />
      </div>
      <a-popover title="自定义列">
        <div slot="content" style="width: 200px;">
          <div :style="{ borderBottom: '1px solid #E9E9E9' }">
            <a-checkbox
              :indeterminate="indeterminate"
              :checked="checkAll"
              @change="onCheckAllChange"
            >
              全选
            </a-checkbox>
          </div>
          <!-- 自定义列字段列表 -->
          <a-checkbox-group v-model="checkedList" @change="onChange">
            <a-checkbox
              v-for="item in columns"
              :key="item.dataIndex"
              :value="item.dataIndex"
              :disabled="item.checkDisabled"
              >{{ item.title }}</a-checkbox
            >
          </a-checkbox-group>
        </div>
        <a-icon class="pointer" type="menu" :style="{ fontSize: '18px' }" />
      </a-popover>
      <a-tooltip>
        <template slot="title">
          清除缓存
        </template>
        <a-popconfirm
          title="清除缓存后会重置为默认自选，是否清除？"
          ok-text="确认"
          cancel-text="取消"
          @confirm="clearLocalStorage"
        >
          <a-icon
            class="pointer ml10"
            type="rest"
            :style="{ fontSize: '18px' }"
            theme="filled"
          />
        </a-popconfirm>
      </a-tooltip>
    </div>
    <div class="mt15">
      <a-table
        :loading="loading"
        :columns="selectedColumns"
        :dataSource="marketList"
        :rowKey="record => record.id"
        :pagination="false"
      >
        <template slot="ups" slot-scope="value, row">
          <a-tag
            :color="
              row.ups > 0
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
        <div slot="action" slot-scope="value, row">
          <a-tooltip>
            <template slot="title">
              取消自选
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
              置顶
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
import pako from "pako";
import NP from "number-precision";
import { mapActions, mapMutations, mapState } from "vuex";
import CoinSelect from "@components/common/coinSelect";

// 当用户的自选为空时，使用内置默认的自选
const DEFAULTCOINS = ["btc", "eth", "ltc", "ht"];

NP.enableBoundaryChecking(false);

export default {
  name: "market",
  components: { CoinSelect },
  data() {
    return {
      isDev: process.env.NODE_ENV === "development",
      upsColor: true, // 涨跌色切换 true = 红涨 false = 绿涨
      checkedList: [], // 选择的字段列表
      indeterminate: true, // 设置 indeterminate 状态，只负责样式控制
      checkAll: false, // 是否全选所有字段
      loading: false, // 是否加载中
      selectedCoin: [], // 选择的币种  添加自选

      wsUrl: process.env.VUE_APP_WS,
      lockReconnect: false, // 连接失败不进行重连
      maxReconnect: 5, // 最大重连次数，若连接失败
      socket: null, // websocket实例

      optionalCoins: [], // 当前自选的币种列表（包含本地缓存）
      marketList: [], // 自选的币种行情数据
      columns: [
        {
          title: "Coin",
          align: "center",
          dataIndex: "name",
          width: 50,
          checked: true, // 是否默认勾选
          checkDisabled: true, // 是否默认禁用
          customRender: val => {
            return val.toUpperCase();
          }
        },
        {
          title: "涨跌幅",
          align: "left",
          dataIndex: "ups",
          checked: true,
          checkDisabled: false,
          scopedSlots: { customRender: "ups" },
          sorter: (a, b) => a.ups > b.ups
        },
        {
          title: "最新",
          align: "left",
          dataIndex: "close",
          width: 100,
          checked: true,
          checkDisabled: false,
          customRender: val => {
            return `$${val}`;
          },
          sorter: (a, b) => a.close > b.close
        },
        {
          title: "最低",
          align: "left",
          dataIndex: "low",
          checked: false,
          checkDisabled: false,
          customRender: val => {
            return `$${val}`;
          },
          sorter: (a, b) => a.low > b.low
        },
        {
          title: "最高",
          align: "left",
          dataIndex: "high",
          checked: false,
          checkDisabled: false,
          customRender: val => {
            return `$${val}`;
          },
          sorter: (a, b) => a.high > b.high
        },
        {
          title: "开盘",
          align: "left",
          dataIndex: "open",
          checked: false,
          checkDisabled: false,
          sorter: (a, b) => a.open > b.open
        },
        {
          title: "成交额",
          align: "left",
          dataIndex: "vol",
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
          sorter: (a, b) => a.vol > b.vol
        },
        {
          title: "成交量",
          align: "left",
          dataIndex: "amount",
          checked: false,
          checkDisabled: false,
          sorter: (a, b) => a.amount > b.amount
        },
        {
          title: "成交笔数",
          align: "left",
          dataIndex: "count",
          checked: false,
          checkDisabled: false,
          sorter: (a, b) => a.count > b.count
        },
        {
          title: "操作",
          align: "center",
          dataIndex: "action",
          width: 70,
          scopedSlots: { customRender: "action" },
          checked: true,
          checkDisabled: true
        }
      ]
    };
  },
  computed: {
    ...mapState({ coins: state => state.coinList }),
    ...mapState(["tableKeys", "myCoinList", "stickList", "manifest"]),
    // 选择显示的列
    selectedColumns() {
      const columns = [];
      this.columns.forEach(item => {
        // 默认显示
        if (
          item.checkDisabled ||
          this.checkedList.some(col => col === item.dataIndex)
        ) {
          columns.push(item);
        }
      });
      return columns;
    },
    indexStyle() {
      const len = this.selectedColumns.length;
      return {
        // 根据表格字段动态设置页面的width
        width: `${len > 4 ? len * 80 : 400}px`
      };
    }
  },
  created() {
    //  TODO 检查是否有新版本
    // chrome.runtime.requestUpdateCheck(res => {
    //   console.log(res);
    // });
    // 先赋值内置的，后面可能有更新的情况 test
    this.columns.forEach(item => {
      if (item.checked) {
        this.checkedList.push(item.dataIndex);
      }
    });
    // 再从本地缓存获取
    if (this.tableKeys.length) {
      this.tableKeys.forEach(item => {
        // 去重添加
        if (!this.checkedList.some(cItem => cItem === item)) {
          // 从倒数第二个位置插入
          this.checkedList.splice(this.checkedList.length - 2, 0, item);
        }
      });
    }
    this._getCoinList();
    this.getOptional();
  },
  methods: {
    ...mapMutations(["_setMyCoinList", "_setTableKeys", "_setStickyList"]),
    ...mapActions(["_getCoinList"]),
    goGithub() {
      chrome.tabs.create({ url: "https://github.com/jsonwu5/huobi-market" });
    },
    feedback() {
      chrome.tabs.create({ url: "https://support.qq.com/product/313772" });
    },
    clearLocalStorage() {
      localStorage.clear();
      this.$message.success("清除成功, 下次打开生效");
    },
    // 自选列表变化
    onChange(checkedList) {
      this.indeterminate =
        !!checkedList.length && checkedList.length < this.columns.length;
      this.checkAll = checkedList.length === this.columns.length;
      this._setTableKeys(checkedList);
    },
    // 自定义列全选所有字段
    onCheckAllChange(e) {
      Object.assign(this, {
        checkedList: e.target.checked
          ? this.columns.map(item => item.dataIndex)
          : [],
        indeterminate: false,
        checkAll: e.target.checked
      });
      this._setTableKeys(this.checkedList);
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
      this._setStickyList(data);
      this.selectedCoin = []; // 清空选择框
      this.getOptional();
    },
    // 从本地缓存获取自选的币种
    getOptional() {
      // 从本地缓存获取自选的币种
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
        this._setStickyList(DEFAULTCOINS);
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
          index
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
      this._setStickyList(list);
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
      this._setStickyList(list);
      // 更新排序index值
      this.marketList.forEach(item => {
        item.index = list.findIndex(sItem => sItem === item.id);
      });
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
        this.socket.onopen = this.websocketonopen;
        this.socket.onerror = this.websocketonerror;
        this.socket.onmessage = this.websocketonmessage;
        this.socket.onclose = this.websocketclose;
      } catch (e) {
        this.loading = false;
        this.reconnect();
      }
    },
    websocketonopen() {
      this.loading = false;
      console.log("WebSocket连接成功", this.socket.readyState);
      // 循环订阅每个币种的主题消息d
      if (this.socket && this.marketList.length) {
        this.marketList.forEach(item => {
          this.getKline(item.name);
        });
      }
    },
    websocketonerror(e) {
      console.log("WebSocket连接发生错误：", e);
      this.reconnect();
    },
    // 接收数据并处理
    websocketonmessage(e) {
      this.blob2json(e.data, res => {
        // console.log("接收到的数据：", res);
        if (res.ping) {
          // 回应心跳包
          this.socket.send(JSON.stringify(res));
        }
        if (res.ch) {
          // 解析币种
          const coinName = res.ch.split(".")[1].split("usdt")[0];
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
              item.amount = parseInt(amount);
              item.open = open;
              item.close = close;
              item.high = high;
              item.id = coinName;
              item.count = count;
              item.low = low;
              item.vol = vol;
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
        }
      });
    },
    websocketclose(e) {
      console.log("connection closed:", e);
      this.reconnect();
    },
    /**
     * 订阅指定币最近24小时的行情概要数据
     * API: https://huobiapi.github.io/docs/spot/v1/cn/#7c47ef3411
     * @param coin { String } 自选币种名称
     */
    getSynopsisBy24h(coin) {
      let data = {
        sub: `market.${coin}usdt.detail`,
        id: "id1"
      };
      this.socket.send(JSON.stringify(data));
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
     * 解压websocket返回的数据
     * @param e { Object } 返回的数据
     * @param callback { Function } 回调函数
     */
    blob2json(e, callback) {
      let reader = new FileReader();
      reader.readAsArrayBuffer(e, "utf-8");
      reader.onload = function() {
        // console.log("blob转ArrayBuffer数据类型", reader.result);
        // 对数据进行解压
        let msg = pako.ungzip(reader.result, {
          to: "string"
        });
        // console.log("ArrayBuffer转字符串", msg);
        callback && callback(JSON.parse(msg));
      };
    }
  },
  // 页面注销，关闭websocket
  destroyed() {
    this.socket.close();
  }
};
</script>
<style lang="less" scoped>
.index {
  transition: all 0.3s;
  min-height: 250px;
  /deep/ .ant-switch {
    background-color: #39c38c;
  }
  /deep/ .ant-switch-checked {
    background-color: #ff704b;
  }
}
</style>
<style lang="less">
.index {
  min-height: 300px;
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    padding: 5px;
  }
  .githubBtn {
    border: none;
    padding: 5px;
  }
}
</style>
