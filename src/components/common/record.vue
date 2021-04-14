<template>
  <a-modal
    title="加减仓详情"
    wrapClassName="record"
    :visible="visible"
    @cancel="close()"
    :footer="null"
    width="calc(100% - 30px)"
  >
    <div class="width-100">
      <custom-columns v-model="selectedColumns" :columns="columns"
        ><a-button class="mb5">自定义列</a-button></custom-columns
      >
      <a-table
        :pagination="false"
        :columns="selectedColumns"
        :dataSource="list"
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
      </a-table>
    </div>
  </a-modal>
</template>

<script>
import { mapState } from "vuex";
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
      columns: [
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "序号",
          align: "center",
          dataIndex: "index",
          width: 60,
          // fixed: "left",
          scopedSlots: { customRender: "index" }
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "时间",
          align: "center",
          ellipsis: true,
          // width: 50,
          dataIndex: "created"
        },
        {
          checked: false, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "交易类型",
          align: "center",
          ellipsis: true,
          width: 100,
          dataIndex: "type"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "交易对",
          align: "center",
          ellipsis: true,
          width: 75,
          dataIndex: "symbol"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "方向",
          align: "center",
          ellipsis: true,
          width: 50,
          dataIndex: "role"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "价格",
          align: "center",
          ellipsis: true,
          width: 100,
          dataIndex: "price"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "数量",
          align: "center",
          ellipsis: true,
          width: 100,
          dataIndex: "realAmount"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "成交额",
          align: "center",
          ellipsis: true,
          // width: 100,
          dataIndex: "realVolume"
        },
        {
          checked: true, // 是否默认勾选
          checkDisabled: false, // 是否默认禁用
          title: "手续费",
          align: "center",
          ellipsis: true,
          // width: 100,
          dataIndex: "points"
        }
      ]
    };
  },
  computed: {
    ...mapState(["buySellRecords"]),
    list() {
      return this.buySellRecords.filter(item => item.coin === this.coin);
    }
  },
  created() {
    this.selectedColumns = this.columns.filter(item => item.checked);
  },
  methods: {
    close() {
      this.$emit("update", false);
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
