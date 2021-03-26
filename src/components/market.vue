<template>
  <div
    class="index pl15 pt15 pr15 pb15"
    :class="isDev ? 'pb30' : 'pb15'"
    :style="indexStyle"
  >
    <!--插件版本信息-->
    <a-space>
      <span class="bold f16">{{ i18n.extName || "火币行情助手" }}</span>
      <span>{{ i18n.extVersion || "当前版本" }}:{{ manifest.version }}</span>
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
        ><span class="ml5">{{ i18n.sourceCode || "源代码" }}</span></a-button
      >
    </a-space>

    <!--币种选择器-->
    <div class="flex ac mt5">
      <coin-select v-if="coins.length" :coin.sync="selectedCoin"></coin-select>
      <a-button class="ml10" @click="addOptional(selectedCoin)">{{
        i18n.addOptional || "添加自选"
      }}</a-button>
    </div>

    <!--功能按钮-->
    <div class="flex ac mt15">
      <div class="mr20">
        <a-select :value="userLang" style="width: 120px" @change="langChange">
          <a-select-option
            v-for="item in langList"
            :value="item.lang"
            :key="item.lang"
          >
            {{ item.name }}
          </a-select-option>
        </a-select>
      </div>
      <div class="mr20">
        <a-switch
          :checked-children="i18n.upsColorRed || '红涨'"
          :un-checked-children="i18n.upsColorGreen || '绿涨'"
          :checked="upsColor"
          @change="switchChange"
        />
      </div>
      <a-tooltip>
        <template slot="title">
          {{ i18n.clearCache || "清除缓存" }}
        </template>
        <a-popconfirm
          :title="
            i18n.clearCacheWarn || '清除缓存后会重置为默认自选，是否清除？'
          "
          :ok-text="i18n.affirm || '确认'"
          :cancel-text="i18n.cancel || '取消'"
          @confirm="clearLocalStorage"
        >
          <a-icon
            class="pointer mr20"
            type="rest"
            :style="{ fontSize: '18px' }"
            theme="filled"
          />
        </a-popconfirm>
      </a-tooltip>
      <a-popover :title="i18n.customColumn || '自定义列'" trigger="click">
        <div slot="content" style="width: 200px;" class="mr20">
          <div class="mb5" :style="{ borderBottom: '1px solid #E9E9E9' }">
            <a-checkbox
              :indeterminate="indeterminate"
              :checked="checkAll"
              @change="onCheckAllChange"
            >
              {{ i18n.checkAll || "全选" }}
            </a-checkbox>
          </div>
          <!-- 自定义列字段列表 -->
          <a-checkbox-group v-model="checkedList" @change="onChange">
            <a-row>
              <a-col v-for="item in columns" :key="item.dataIndex" :span="12">
                <a-checkbox
                  :value="item.dataIndex"
                  :disabled="item.checkDisabled"
                  >{{ item.title }}</a-checkbox
                >
              </a-col>
            </a-row>
          </a-checkbox-group>
        </div>
        <a-icon class="pointer f18 mr20" type="menu" />
      </a-popover>
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
      <a-tooltip>
        <template slot="title">
          {{ i18n.exportConfig || "导出配置" }}
        </template>
        <a-icon
          class="mr20 pointer f18"
          @click="downloadConfig()"
          type="download"
        />
      </a-tooltip>
      <a-tooltip>
        <template slot="title">
          {{ i18n.importConfig || "导入配置" }}
        </template>
        <a-upload
          accept=".json"
          name="file"
          :multiple="false"
          :before-upload="uploadConfig"
          :show-upload-list="false"
        >
          <a-icon class="mr20 pointer f18" type="upload" />
        </a-upload>
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
import pako from "pako";
import NP from "number-precision";
import CoinSelect from "@components/common/coinSelect";
import { formatNum, deBonce, throttle } from "@/tools";
import { clearStorage, getStorage, KYELIST } from "@/tools/storage";
import { mapActions, mapMutations, mapState, mapGetters } from "vuex";
import FileSaver from "file-saver";

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
  components: { CoinSelect },
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
      langList: [
        {
          name: "中文",
          lang: "zh_CN"
        },
        {
          name: "English",
          lang: "en"
        }
      ],

      dataPool: {}, // 数据缓冲池
      isDev: process.env.NODE_ENV === "development",
      checkedList: [], // 选择的字段列表
      indeterminate: true, // 设置 indeterminate 状态，只负责样式控制
      checkAll: false, // 是否全选所有字段
      loading: true, // 是否加载中
      selectedCoin: [], // 选择的币种  添加自选

      wsUrl: process.env.VUE_APP_WS,
      lockReconnect: false, // 连接失败不进行重连
      maxReconnect: 5, // 最大重连次数，若连接失败
      socket: null, // websocket实例

      optionalCoins: [], // 当前自选的币种列表（包含缓存）
      marketList: [], // 自选的币种行情数据
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
      "manifest",
      "upsColor",
      "badgeCoin",
      "sortConfig",
      "userLang",
      "tableWidths"
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
    // 选择显示的列 真正展示的列
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
        width: `${num}px`
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
      "_setUpsColor",
      "_setBadgeCoin",
      "_setSortConfig",
      "_setUserLang",
      "_setTableWidths"
    ]),
    ...mapActions([
      "_getCoinList",
      "_getLanguageAll",
      "_initCache",
      "_importConfig"
    ]),
    init() {
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
    // 导出配置文件
    downloadConfig() {
      getStorage(KYELIST).then(res => {
        // 将json转换成字符串
        const data = JSON.stringify(res, null, 2);
        const blob = new Blob([data], { type: "" });
        FileSaver.saveAs(blob, "Huobi_market_config.json");
      });
    },
    // 导入配置文件
    uploadConfig(file) {
      // console.log(file);
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = event => {
        // console.log(event);
        try {
          const data = JSON.parse(event.target.result);
          this._importConfig(data);
        } catch (e) {
          console.log(e);
          throw new Error(e);
        }
        // 检测是否导入成功
      };
      return false;
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
    // 切换语言
    langChange(val) {
      this._setUserLang(val);
      this._getLanguageAll();
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
    switchChange(e) {
      this._setUpsColor(e);
      // 通知角标重新初始化
      chrome.runtime.sendMessage({
        type: "refreshBadge"
      });
    },
    goGithub() {
      chrome.tabs.create({ url: "https://github.com/jsonwu5/huobi-market" });
    },
    feedback() {
      chrome.tabs.create({ url: "https://support.qq.com/product/313772" });
    },
    clearLocalStorage() {
      clearStorage().then(() => {
        // this.$message.success(this.i18n.clearMsg || "清除成功, 下次打开生效");
        // 通知角标重新初始化
        chrome.runtime.sendMessage({
          type: "refreshBadge"
        });
        location.reload();
      });
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
      this.blob2json(e.data, res => {
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
          if (!coinItem.close) {
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
    this.socket.close();
  }
};
</script>
<style lang="less">
.index {
  overflow: auto;
  min-height: 300px;
  max-height: 600px;
  max-width: 800px;
  transition: all 0.3s;
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    padding: 5px;
  }
  .githubBtn {
    border: none;
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
