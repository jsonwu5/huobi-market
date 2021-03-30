<template>
  <a-select
    :placeholder="i18n.selectCoin || '请选择币种'"
    style="width: 300px;text-transfrom: uppercase"
    show-search
    allowClear
    mode="multiple"
    :value="selectedCoin"
    :default-active-first-option="false"
    :show-arrow="false"
    :filter-option="false"
    :not-found-content="null"
    dropdownClassName="customSelect"
    @search="handleSearch"
    @change="change"
  >
    <div slot="dropdownRender" slot-scope="coinSelectList">
      <v-nodes :vnodes="coinSelectList" />
      <a-divider style="margin: 4px 0" />
      <div
        style="padding: 4px 8px; cursor: pointer"
        @mousedown="e => e.preventDefault()"
      >
        <a-pagination
          v-model="params.pageNumber"
          simple
          :total="coinTotal"
          show-size-changer
          show-quick-jumper
          @change="(a, b) => selectPageChange(a, b)"
        />
      </div>
    </div>
    <a-select-option v-for="item in coinSelectList" :key="item" :value="item">
      {{ item.toUpperCase() }}
    </a-select-option>
  </a-select>
</template>

<script>
import { deBonce } from "@tools";
import { mapActions, mapGetters, mapState } from "vuex";

export default {
  name: "coinSelect",
  model: {
    prop: "coin",
    event: "update"
  },
  props: {
    // 选择的币种
    coin: {
      type: Array,
      default: () => []
    }
  },
  components: {
    VNodes: {
      functional: true,
      render: (h, ctx) => ctx.props.vnodes
    }
  },
  data() {
    return {
      selectedCoin: [],
      coinTotal: 0,
      params: {
        pageNumber: 1,
        resultSize: 10,
        coinName: "" // 搜索的币种名称
      }
    };
  },
  computed: {
    ...mapState(["coinSelectList"]),
    ...mapGetters(["i18n"])
  },
  watch: {
    coin: {
      handler(val) {
        this.selectedCoin = val;
      },
      immediate: true
    }
  },
  created() {
    this.getCoins();
  },
  methods: {
    ...mapActions(["_getCoinPager"]),
    change(val) {
      this.$emit("update:coin", val);
    },
    handleSearch(value) {
      deBonce(() => {
        this.params.coinName = value;
        this.getCoins(true);
      }, 350);
    },
    getCoins(refresh = false) {
      if (refresh === true) {
        this.params.pageNumber = 1;
      }
      this._getCoinPager(this.params).then(res => {
        this.coinTotal = res.total;
      });
    },
    selectPageChange(page, size, isTag = false) {
      if (!isTag) {
        this.params.pageNumber = page;
        this.params.resultSize = size;
        this.getCoins();
      }
    }
  }
};
</script>
<style lang="less">
.customSelect {
  .ant-select-dropdown-menu {
    max-height: 150px;
  }
}
</style>
<style lang="less" scoped>
/deep/ .ant-select-search__field {
  text-transform: uppercase;
}
</style>
