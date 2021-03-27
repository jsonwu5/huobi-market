<template>
  <!-- 收益统计 -->
  <div class="earnings">
    <a-table
      :loading="loading"
      :columns="columns"
      :dataSource="list"
      :rowKey="record => record.id"
      :pagination="false"
      @change="onTableChange"
      bordered
    >
    </a-table>
  </div>
</template>

<script>
import NP from "number-precision/src/index";
// import { formatNum } from "@tools";

export default {
  name: "earnings",
  data() {
    return {
      loading: false,
      columns: [
        {
          title: "Coin",
          align: "center",
          dataIndex: "name",
          i18nKey: "colCoin"
        },
        {
          title: "数量",
          align: "left",
          dataIndex: "coinCount",
          scopedSlots: { customRender: "coinCount" },
          sorter: (a, b) => a.coinCount - b.coinCount,
          i18nKey: "colCoinCount"
        },
        {
          title: "成本价",
          align: "left",
          dataIndex: "costPrice",
          width: 80,
          customRender: val => {
            return `$${val}`;
          },
          sorter: (a, b) => a.costPrice - b.costPrice,
          i18nKey: "colCostPrice"
        },
        {
          title: "总价值",
          align: "left",
          dataIndex: "totalNetValue",
          customRender: val => {
            return `$${val}`;
          },
          sorter: (a, b) => a.totalNetValue - b.totalNetValue,
          i18nKey: "colTotalNetValue"
        },
        {
          title: "持有收益",
          align: "left",
          dataIndex: "gains",
          customRender: val => {
            return `$${val}`;
          },
          sorter: (a, b) => a.gains - b.gains,
          i18nKey: "colGains"
        },
        {
          title: "涨跌幅",
          align: "left",
          dataIndex: "gainsUps",
          customRender: value => {
            const unit = 100000000;
            const val =
              value > 10000
                ? NP.round(NP.divide(value, unit), 2) + "亿"
                : NP.round(value, 2);
            return `￥${val}`;
          },
          sorter: (a, b) => a.gainsUps - b.gainsUps,
          i18nKey: "colAainsUps"
        },
        {
          title: "今日收益",
          align: "left",
          dataIndex: "todayGains",
          sorter: (a, b) => a.todayGains - b.todayGains,
          i18nKey: "colTodayGains"
        },
        {
          title: "操作",
          align: "center",
          dataIndex: "action",
          scopedSlots: { customRender: "action" },
          i18nKey: "colOperation"
        }
      ],
      list: [
        {
          name: "OXT",
          coinCount: 105.2655,
          costPrice: 1.36,
          totalNetValue: 0,
          gains: 0,
          gainsUps: 0,
          todayGains: 0
        }
      ]
    };
  },
  methods: {
    onTableChange() {}
  }
};
</script>

<style scoped lang="less">
.earnings {
}
</style>
