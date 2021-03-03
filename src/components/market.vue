<template>
  <div class="index pl15 pt15 pr15 pb15">
    <div class="pt30">
      <a-select
        v-model="selectedCoin"
        class="width-100"
        mode="multiple"
        placeholder="请选择币种"
      >
        <a-select-option v-for="item in coins" :key="item">
          {{ item }}
        </a-select-option>
      </a-select>
      <a-button class="mt10" @click="addOptional(selectedCoin)"
        >添加自选</a-button
      >
    </div>
    <div class="mt15">
      <a-table
        :loading="loading"
        :columns="columns"
        :dataSource="coinList"
        :rowKey="record => record.id"
        :pagination="false"
      >
        <div slot="action" slot-scope="value, row">
          <a-icon @change="cancel(row)" type="star" theme="filled" />
        </div>
      </a-table>
    </div>
  </div>
</template>

<script>
import pako from "pako";

const heartCheck = {
  timeout: 60 * 1000,
  timer: null,
  serverTimer: null,
  reset() {
    this.timer && clearTimeout(this.timer);
    this.serverTimer && clearTimeout(this.serverTimer);
  },
  start(ws) {
    this.reset();
    this.timer = setTimeout(() => {
      // console.log('发送心跳,后端收到后，返回一个心跳消息')
      // onmessage拿到返回的心跳就说明连接正常
      ws.send(JSON.stringify({ heart: 1 }));
      this.serverTimer = setTimeout(() => {
        // 如果超过一定时间还没响应(响应后触发重置)，说明后端断开了
        ws.close();
      }, this.timeout);
    }, this.timeout);
  }
};

export default {
  name: "HelloWorld",
  data() {
    return {
      loading: false,
      coins: [], // 支持的币种列表
      selectedCoin: [], // 选择的币种
      selectedList: [], // 自选的列表
      wsUrl: "wss://api-aws.huobi.pro/ws", // ws wss
      lockReconnect: false, // 连接失败不进行重连
      maxReconnect: 5, // 最大重连次数，若连接失败
      socket: null, // websocket实例
      coinList: [], // 自选的币种行情概要
      columns: [
        {
          title: "币种",
          align: "center",
          dataIndex: "name"
        },
        {
          title: "最新",
          align: "center",
          dataIndex: "close",
          customRender: val => {
            return `$${val}`;
          }
        },
        {
          title: "最低",
          align: "center",
          dataIndex: "low",
          customRender: val => {
            return `$${val}`;
          }
        },
        {
          title: "最高",
          align: "center",
          dataIndex: "high",
          customRender: val => {
            return `$${val}`;
          }
        },
        // {
        //   title: "开盘",
        //   align: "center",
        //   dataIndex: "open"
        // },
        {
          title: "成交额",
          align: "center",
          dataIndex: "vol",
          customRender: val => {
            return `￥${val}`;
          }
        },
        // {
        //   title: "成交量",
        //   align: "center",
        //   dataIndex: "amount"
        // },
        // {
        //   title: "成交笔数",
        //   align: "center",
        //   dataIndex: "count"
        // }
        {
          title: "操作",
          align: "center",
          dataIndex: "action",
          scopedSlots: { customRender: "action" }
        }
      ]
    };
  },
  computed: {
    // defaultText() {
    //   return browser.i18n.getMessage("extName");
    // }
  },
  created() {
    this.getCoinList();
    this.getOptional();
  },
  methods: {
    // 获取支持的币种
    getCoinList() {
      this.$http.get("https://api.huobi.pro/v1/common/currencys").then(res => {
        this.coins = res;
      });
    },
    // 保存自选到本地localStorage
    addOptional(list = []) {
      let data = localStorage.getItem("selectedCoin");
      data = data && data.length ? JSON.parse(data) : [];
      data = data.concat(list);
      this.selectedList = data;
      localStorage.setItem("selectedCoin", JSON.stringify(data));
      this.getOptional();
    },
    // 从本地获取自选的币种
    getOptional() {
      // 从本地获取自选的币种
      const data = localStorage.getItem("selectedCoin");
      this.selectedList = data && data.length ? JSON.parse(data) : [];
      const coinList = [];
      // 组合成table需要的数据格式
      this.selectedList.forEach(item => {
        coinList.push({
          name: item,
          amount: 0,
          open: 0,
          close: 0,
          high: 0,
          id: item,
          count: 0,
          low: 0,
          vol: 0
        });
      });
      this.coinList = coinList;
      this.initWebSocket();
    },
    cancel(row) {
      // 从本地获取自选的币种
      this.selectedList.forEach((item, index) => {
        if (row.name === item) {
          this.selectedList.splice(index, 1);
        }
      });
      this.addOptional(this.selectedList);
    },
    reconnect() {
      console.log("尝试重连");
      if (this.lockReconnect || this.maxReconnect <= 0) {
        return;
      }
      setTimeout(() => {
        // this.maxReconnect-- // 不做限制 连不上一直重连
        this.initWebSocket();
      }, 60 * 1000);
    },
    initWebSocket() {
      try {
        if ("WebSocket" in window) {
          this.socket = new WebSocket(this.wsUrl);
        } else {
          console.log("您的浏览器不支持websocket");
        }
        this.socket.onopen = this.websocketonopen;
        this.socket.onerror = this.websocketonerror;
        this.socket.onmessage = this.websocketonmessage;
        this.socket.onclose = this.websocketclose;
      } catch (e) {
        this.reconnect();
      }
    },
    websocketonopen() {
      console.log("WebSocket连接成功", this.socket.readyState);
      heartCheck.start(this.socket);
      // this.websocketsend();
      // 循环订阅每个币种的主题消息d
      if (this.socket && this.coinList.length) {
        this.coinList.forEach(item => {
          this.websocketsend(item.name);
        });
      }
    },
    websocketonerror(e) {
      console.log("WebSocket连接发生错误", e);
      this.reconnect();
    },
    // 接收数据并处理
    websocketonmessage(e) {
      this.blob2json(e.data, res => {
        console.log("接收到的数据：", res);
        if (res.ch) {
          // 解析币种
          const coinName = res.ch.split(".")[1].split("usdt")[0];
          // 更新数据
          this.coinList.some(item => {
            if (item.name === coinName) {
              const {
                amount,
                open,
                close,
                high,
                id,
                count,
                low,
                vol
              } = res.tick;
              item.amount = parseInt(amount);
              item.open = open;
              item.close = close;
              item.high = high;
              item.id = id;
              item.count = count;
              item.low = low;
              const unit = 100000000;
              item.vol = vol > unit ? parseInt(vol / 100000000) + "亿" : vol;
              return true;
            }
            return false;
          });
          console.log(this.coinList);
        }
      });
      // 消息获取成功，重置心跳
      heartCheck.start(this.socket);
    },
    websocketclose(e) {
      console.log("connection closed (" + e.code + ")");
      this.reconnect();
    },
    /**
     * 订阅指定币主题
     * @param coin
     */
    websocketsend(coin) {
      let data = {
        sub: `market.${coin}usdt.detail`,
        id: "id1"
      };
      this.socket.send(JSON.stringify(data));
    },
    //数据接收
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
  destroyed() {
    this.socket.close();
  }
};
</script>

<style lang="less">
.index {
  width: 700px;
}
p {
  font-size: 20px;
}
</style>
