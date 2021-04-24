<template>
  <a-modal
    title="加减仓详情"
    wrapClassName="record"
    :visible="visible"
    centered
    @cancel="close()"
    :footer="null"
    width="calc(100% - 30px)"
  >
    <div class="width-100 pb15 pl15 pr15">
      <custom-columns
        class="mt15 mb15"
        v-model="selectedColumns"
        :columns="columns"
        placement="rightTop"
        :checkedList.sync="checkedList"
      ></custom-columns>

      <a-table
        :pagination="false"
        :columns="selectedColumns"
        :dataSource="data"
        :rowKey="(record, index) => index"
        :scroll="{ y: 300 }"
        bordered
        centered
      >
        <template slot-scope="text, row, index" slot="index">
          <span>{{ index + 1 }}</span>
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
      columns: [
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "序号",
          align: "center",
          dataIndex: "index",
          width: 60,
          // fixed: "left",
          scopedSlots: { customRender: "index" },
          i18nKey: "colIndex"
        },
        {
          checked: false, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "交易类型",
          align: "center",
          ellipsis: true,
          width: 100,
          dataIndex: "type",
          i18nKey: "colType"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "交易对",
          align: "center",
          ellipsis: true,
          width: 75,
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
          i18nKey: "colRole"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "价格",
          align: "center",
          ellipsis: true,
          width: 100,
          dataIndex: "price",
          i18nKey: "colPrice"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "数量",
          align: "center",
          ellipsis: true,
          width: 100,
          dataIndex: "realAmount",
          i18nKey: "colRealAmount"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "成交额",
          align: "center",
          ellipsis: true,
          // width: 100,
          dataIndex: "realVolume",
          i18nKey: "colRealVolume"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "手续费",
          align: "center",
          ellipsis: true,
          // width: 100,
          dataIndex: "points",
          i18nKey: "colPoints"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "时间",
          align: "center",
          ellipsis: true,
          // width: 50,
          dataIndex: "created",
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
      data: []
    };
  },
  computed: {
    ...mapState(["buySellRecords"]),
    ...mapGetters(["i18n"]),
    records() {
      return this.buySellRecords.map((item, index) => ({ ...item, index }));
    },
    list() {
      return this.records.filter(item => item.coin === this.coin);
    }
  },
  created() {
    this.data = JSON.parse(JSON.stringify(this.list));
    this.selectedColumns = this.columns.filter(item => item.checked);
  },
  methods: {
    ...mapMutations(["_setBuySellRecords"]),
    close() {
      this.$emit("update", false);
    },
    deleteRecord(row) {
      const arr = this.buySellRecords.filter(
        (item, index) => row.index !== index
      );
      this._setBuySellRecords(arr);
    }
  }
};
</script>

<style lang="less">
.record {
  .ant-modal-body {
    padding: 5px;
  }
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    padding: 2px !important;
  }
}
</style>
