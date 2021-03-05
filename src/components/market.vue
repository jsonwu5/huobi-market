<template>
  <div class="index pl15 pt15 pr15 pb15" :style="indexStyle">
    <div class="flex ac">
      <a-select
        style="width: 300px;"
        v-model="selectedCoin"
        class="width-100"
        mode="multiple"
        placeholder="请选择币种"
        allowClear
        dropdownClassName="customSelect"
      >
        <a-select-option v-for="item in coins" :key="item">
          {{ item }}
        </a-select-option>
      </a-select>
      <a-button class="ml10" @click="addOptional(selectedCoin)"
        >添加自选</a-button
      >
    </div>
    <div class="flex jfe ac mt15">
      <div class="mr15">
        <a-switch
          checked-children="红涨"
          un-checked-children="绿涨"
          v-model="upsColor"
        />
      </div>
      <a-popover title="自定义列">
        <template slot="content">
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
        </template>
        <a-icon class="pointer" type="menu" :style="{ fontSize: '18px' }" />
      </a-popover>
    </div>
    <div class="mt5">
      <a-table
        :loading="loading"
        :columns="selectedColumns"
        :dataSource="marketList"
        :rowKey="record => record.id"
        :pagination="false"
        bordered
      >
        <template slot="ups" slot-scope="value, row">
          <a-badge
            :count="`${row.ups > 0 ? '+' + row.ups : row.ups}%`"
            :show-zero="true"
            :number-style="{
              backgroundColor:
                row.ups > 0
                  ? upsColor
                    ? '#ff2e39'
                    : '#52c41a'
                  : upsColor
                  ? '#52c41a'
                  : '#ff2e39'
            }"
          ></a-badge>
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
        </div>
      </a-table>
    </div>
  </div>
</template>

<script>
import pako from "pako";
import NP from "number-precision";
import { mapActions, mapMutations, mapState } from "vuex";

// 当用户的自选为空时，使用内置默认的自选
const DEFAULTCOINS = ["btc", "eth", "ltc", "ht"];

NP.enableBoundaryChecking(false);

export default {
  name: "market",
  data() {
    return {
      upsColor: true, // 涨跌色切换
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
          checkDisabled: true // 是否默认禁用
        },
        {
          title: "涨跌幅",
          align: "center",
          dataIndex: "ups",
          width: 100,
          checked: true,
          checkDisabled: false,
          scopedSlots: { customRender: "ups" }
        },
        {
          title: "最新",
          align: "center",
          dataIndex: "close",
          width: 100,
          checked: true,
          checkDisabled: false,
          customRender: val => {
            return `$${val}`;
          }
        },
        {
          title: "最低",
          align: "center",
          dataIndex: "low",
          checked: false,
          checkDisabled: false,
          customRender: val => {
            return `$${val}`;
          }
        },
        {
          title: "最高",
          align: "center",
          dataIndex: "high",
          checked: false,
          checkDisabled: false,
          customRender: val => {
            return `$${val}`;
          }
        },
        {
          title: "开盘",
          align: "center",
          dataIndex: "open",
          checked: false,
          checkDisabled: false
        },
        {
          title: "成交额",
          align: "center",
          dataIndex: "vol",
          checked: false,
          checkDisabled: false,
          customRender: val => {
            return `￥${val}`;
          }
        },
        {
          title: "成交量",
          align: "center",
          dataIndex: "amount",
          checked: false,
          checkDisabled: false
        },
        {
          title: "成交笔数",
          align: "center",
          dataIndex: "count",
          checked: false,
          checkDisabled: false
        },
        {
          title: "操作",
          align: "center",
          dataIndex: "action",
          width: 50,
          scopedSlots: { customRender: "action" },
          checked: true,
          checkDisabled: true
        }
      ]
    };
  },
  computed: {
    ...mapState({ coins: state => state.coinList }),
    ...mapState(["tableKeys", "myCoinList"]),
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
    // 先赋值内置的，后面可能有更新的情况 test
    this.columns.forEach(item => {
      if (item.checked) {
        this.checkedList.push(item.dataIndex);
      }
    });
    // TODO 缓存里的配置覆盖默认的
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
    ...mapMutations(["_setMyCoinList", "_setTableKeys"]),
    ...mapActions(["_getCoinList"]),
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
      this.getOptional();
    },
    // 从本地获取自选的币种
    getOptional() {
      // 从本地获取自选的币种
      this.optionalCoins = JSON.parse(JSON.stringify(this.myCoinList));
      // 用户刚安装，没有自选时，使用内置默认的自选
      if (this.optionalCoins.length === 0) {
        this.optionalCoins = DEFAULTCOINS;
        // 并缓存到本地
        this._setMyCoinList(DEFAULTCOINS);
      }
      const marketList = [];
      // 组合成table需要的数据格式
      this.optionalCoins.forEach(item => {
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
          ups: 0
        });
      });
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
              const unit = 100000000;
              item.vol = vol > unit ? parseInt(vol / 100000000) + "亿" : vol;
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

<style lang="less">
.index {
  //min-width: 400px;
  min-height: 250px;
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    padding: 5px;
  }
}
.customSelect {
  .ant-select-dropdown-content {
    height: 150px;
  }
  .ant-select-dropdown-menu {
    max-height: 150px;
  }
}
</style>
