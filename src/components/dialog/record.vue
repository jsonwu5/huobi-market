<template>
  <a-modal
    title="加减仓详情"
    wrapClassName="record-modal"
    :visible="visible"
    centered
    @cancel="close()"
    :footer="null"
    width="calc(100% - 30px)"
  >
    <div class="record width-100 pb15 pl15 pr15">
      <div class="flex ac mt15 flex-wrap">
        <custom-columns
          class="mr15 mb15"
          v-model="selectedColumns"
          :columns="columns"
          placement="rightTop"
          :checkedList.sync="checkedList"
          style="margin-top: 2px"
        ></custom-columns>
        <div class="mr15 mb15">合计：{{ calcData.totalCount }}</div>
        <div class="mr15 mb15">加仓次数：{{ calcData.buyCount }}</div>
        <div class="mr15 mb15">减仓次数：{{ calcData.saleCount }}</div>
        <div class="mr15 mb15">累计加仓金额：{{ calcData.buyMoney }}</div>
        <div class="mr15 mb15">累计减仓金额：{{ calcData.saleNumber }}</div>
        <div class="mr15 mb15">累计加仓数量：{{ calcData.buyCoinCount }}</div>
        <div class="mr15 mb15">累计减仓数量：{{ calcData.saleCoinCount }}</div>
        <div class="mr15 mb15">当前持仓数量：{{ calcData.totalCoinCount }}</div>
      </div>

      <a-table
        :loading="loading"
        :pagination="pagination"
        :columns="selectedColumns"
        :dataSource="data"
        :rowKey="(record, index) => index"
        :scroll="{ y: scrollHeight }"
        :rowClassName="rowClassName"
        @change="handleTableChange"
        bordered
      >
        <template slot-scope="text, row, index" slot="index">
          <span>{{
            (params.pageNumber - 1) * params.resultSize + (index + 1)
          }}</span>
        </template>
        <span slot="created" slot-scope="created">{{
          created | formatDate
        }}</span>
        <a-space slot="action" align="center" slot-scope="value, row">
          <a-popconfirm
            placement="left"
            title="确认要删除该条记录吗"
            :ok-text="i18n.affirm || '确认'"
            :cancel-text="i18n.cancel || '取消'"
            @confirm="deleteRecord(row)"
          >
            <a-tooltip
              placement="left"
              :get-popup-container="e => e.parentElement"
            >
              <template slot="title">
                删除该条记录
              </template>
              <a-icon class="pointer f18" type="delete" theme="filled" />
            </a-tooltip>
          </a-popconfirm>

          <a-tooltip
            placement="left"
            :get-popup-container="e => e.parentElement"
          >
            <template slot="title">
              修改
            </template>
            <a-icon class="pointer f18" type="edit" />
          </a-tooltip>
        </a-space>
      </a-table>
    </div>
  </a-modal>
</template>

<script>
import { mapGetters, mapState, mapMutations } from "vuex";
import CustomColumns from "@components/common/customColumns";
import NP from "number-precision";
import { getDataByPage } from "@/tools";

export default {
  name: "record",
  components: { CustomColumns },
  model: {
    prop: "visible",
    event: "update"
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    coin: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      columnsVisible: false,
      selectedColumns: [],
      checkedList: [],
      rowClassName: row => {
        return row.role === "买入" ? "buyBgColor" : "saleBgColor";
      },
      columns: [
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "序号",
          align: "center",
          dataIndex: "index",
          width: 60,
          scopedSlots: { customRender: "index" },
          i18nKey: "colIndex"
        },
        {
          checked: false, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "交易类型",
          align: "right",
          ellipsis: true,
          width: 100,
          dataIndex: "type",
          i18nKey: "colType"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "交易对",
          align: "right",
          ellipsis: true,
          width: 100,
          customRender: val => {
            return `${val.toUpperCase()}`;
          },
          dataIndex: "symbol",
          i18nKey: "colSymbol"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "方向",
          align: "center",
          ellipsis: true,
          width: 50,
          dataIndex: "role",
          sorter: (a, b) => a.role.charCodeAt() - b.role.charCodeAt(),
          i18nKey: "colRole"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "价格",
          align: "right",
          ellipsis: true,
          width: 100,
          dataIndex: "price",
          sorter: (a, b) => a.price - b.price,
          i18nKey: "colPrice"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "数量",
          align: "right",
          ellipsis: true,
          width: 100,
          dataIndex: "realAmount",
          sorter: (a, b) => a.realAmount - b.realAmount,
          i18nKey: "colRealAmount"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "成交额",
          align: "right",
          ellipsis: true,
          dataIndex: "realVolume",
          sorter: (a, b) => a.realVolume - b.realVolume,
          i18nKey: "colRealVolume"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "手续费",
          align: "right",
          ellipsis: true,
          customRender: (val, row) => {
            return `${val} ${row.pointsUnit.toUpperCase()}`;
          },
          dataIndex: "points",
          sorter: (a, b) => a.points - b.points,
          i18nKey: "colPoints"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "时间",
          align: "center",
          ellipsis: true,
          dataIndex: "created",
          sorter: (a, b) =>
            new Date(a.created).getTime() - new Date(b.created).getTime(),
          i18nKey: "colTime"
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
      ],
      data: [],
      loading: false,
      pagination: {
        current: 1, // 当前页面
        hideOnSinglePage: false, // 只有一页时是否隐藏分页器
        total: 0,
        pageSize: 20, // 默认每页显示数量
        showSizeChanger: true, // 显示可改变每页数量
        pageSizeOptions: ["10", "20", "30", "40", "50", "100", "150", "200"], // 每页数量选项
        showTotal: total => `共 ${total} 条` // 显示总数
      },
      params: {
        pageNumber: 1,
        resultSize: 20
      }
    };
  },
  computed: {
    ...mapState(["buySellRecords", "openType"]),
    ...mapGetters(["i18n"]),
    scrollHeight() {
      return this.openType === 0 ? 300 : document.body.clientHeight * 0.6;
    },
    records() {
      return this.buySellRecords.map((item, index) => ({ ...item, index }));
    },
    list() {
      return this.records.filter(item => item.coin === this.coin);
    },
    calcData() {
      const buy = this.list.filter(item => item.role === "买入");
      const sale = this.list.filter(item => item.role === "卖出");

      const buyCoinCount = buy.reduce((a, b) => NP.plus(a, b.realAmount), 0);
      const saleCoinCount = sale.reduce((a, b) => NP.plus(a, b.realAmount), 0);
      return {
        buyCount: buy.length,
        saleCount: sale.length,
        totalCount: this.list.length,
        buyMoney: buy.reduce((a, b) => NP.plus(a, b.realVolume), 0),
        saleNumber: sale.reduce((a, b) => NP.plus(a, b.realVolume), 0),
        buyCoinCount,
        saleCoinCount,
        totalCoinCount: NP.minus(buyCoinCount, saleCoinCount)
      };
    }
  },
  created() {
    this.originalData = JSON.parse(JSON.stringify(this.list));
    this.getList();
    this.selectedColumns = this.columns.filter(item => item.checked);
  },
  methods: {
    ...mapMutations(["_setBuySellRecords"]),
    handleTableChange(pagination) {
      console.log(pagination);
      const pager = { ...this.pagination };
      pager.current = pagination.current;
      pager.pageSize = pagination.pageSize;
      this.pagination = pager;
      if (this.params.pageNumber !== pagination.current) {
        this.params.pageNumber = pagination.current;
        this.params.resultSize = pagination.pageSize;
        this.getList();
      }
      if (this.params.resultSize !== pagination.pageSize) {
        this.params.resultSize = pagination.pageSize;
        this.getList(true);
      }
    },
    close() {
      this.$emit("update", false);
    },
    deleteRecord(row) {
      const arr = this.buySellRecords.filter(
        (item, index) => row.index !== index
      );
      this._setBuySellRecords(arr);
    },
    getList(refresh = false) {
      if (refresh) {
        this.params.pageNumber = 1;
      }
      this.loading = true;
      getDataByPage(this.originalData, this.params)
        .then(res => {
          this.data = res.list;
          this.pagination.total = res.total;
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }
};
</script>

<style scoped lang="less">
.record {
  /deep/ .buyBgColor {
    background-color: rgba(255, 112, 75, 0.15);
  }
  /deep/ .saleBgColor {
    background-color: rgba(57, 195, 140, 0.15);
  }
}
</style>
<style lang="less">
.record-modal {
  .ant-modal-body {
    padding: 5px;
  }
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    padding: 2px !important;
  }
}
</style>
