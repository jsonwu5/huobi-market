<template>
  <a-select
    mode="multiple"
    placeholder="请选择币种"
    style="width: 150px"
    show-search
    allowClear
    v-model="selectService"
    :default-active-first-option="false"
    :show-arrow="false"
    :filter-option="false"
    :not-found-content="null"
    @search="handleSearch"
    @change="search"
  >
    <div slot="dropdownRender" slot-scope="services">
      <v-nodes :vnodes="services" />
      <a-divider style="margin: 4px 0" />
      <div
        style="padding: 4px 8px; cursor: pointer"
        @mousedown="e => e.preventDefault()"
      >
        <a-pagination
          v-model="serviceParams.pageNumber"
          simple
          :total="servicesTotal"
          show-size-changer
          show-quick-jumper
          @change="(a, b) => selectPageChange(a, b)"
        />
      </div>
    </div>
    <a-select-option
      v-for="(item, index) in services"
      :key="item"
      :value="index"
    >
      {{ item }}
    </a-select-option>
  </a-select>
</template>

<script>
import { deBonce } from "@/tools";

export default {
  name: "serviceSelect",
  props: {
    // 是否展示选择全部
    showAll: {
      type: Boolean,
      default: true
    },
    // 选择的客服ID
    selectId: {
      type: String,
      default: ""
    },
    // 选择的客服项
    selectItem: {
      type: Object,
      default: () => {}
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
      selectService: undefined, // 选择的客服下标
      services: [], // 客服列表
      servicesTotal: 0, // 客服总数
      serviceParams: {
        pageNumber: 1,
        resultSize: 10,
        memberName: ""
      }
    };
  },
  computed: {
    // 客服ID
    followMemberId() {
      if (!this.selectService) return this.selectId;
      return this.services[this.selectService].id;
    },
    followItem() {
      if (!this.selectService) return {};
      return this.services[this.selectService];
    }
  },
  created() {
    this.getServices();
  },
  methods: {
    search() {
      this.$emit("update:selectItem", this.followItem);
      this.$emit("update:selectId", this.followMemberId);
      this.$emit("change", true);
    },
    handleSearch(value) {
      deBonce(() => {
        this.serviceParams.memberName = value;
        this.getServices(true);
      }, 350);
    },
    // 获取客服列表
    getServices(refresh = false) {
      if (refresh === true) {
        this.serviceParams.pageNumber = 1;
      }
      this.$http.get("/v1/common/currencys").then(res => {
        this.services = res;
        this.servicesTotal = res.length;
      });
    },
    selectPageChange(page, size, isTag = false) {
      if (!isTag) {
        this.serviceParams.pageNumber = page;
        this.serviceParams.resultSize = size;
        this.getServices();
      }
    }
  }
};
</script>

<style scoped></style>
