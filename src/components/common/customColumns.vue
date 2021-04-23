<template>
  <div class="customColumns">
    <a-popover
      :title="i18n.customColumn || '自定义列'"
      trigger="click"
      :placement="placement"
    >
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
        <a-checkbox-group :value="checkedList" @change="onChange">
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
      <slot>
        <a-tooltip
          placement="topLeft"
          :get-popup-container="e => e.parentElement"
        >
          <template slot="title">
            {{ i18n.customColumn || "自定义列" }}
          </template>
          <a-icon class="pointer f18 mr20" type="menu" />
        </a-tooltip>
      </slot>
    </a-popover>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "customColumns",
  model: {
    prop: "value",
    event: "change"
  },
  props: {
    // 所有列
    columns: {
      type: Array,
      default: () => []
    },
    // 当前选择的列
    value: {
      type: Array,
      default: () => []
    },
    // 当前显示的字段列表
    checkedList: {
      type: Array,
      default: () => []
    },
    // 弹出方向
    placement: {
      type: String,
      default: "bottom"
    }
  },
  data() {
    return {
      indeterminate: true, // 设置 indeterminate 状态，只负责样式控制
      checkAll: false // 是否全选所有字段
    };
  },
  computed: {
    ...mapGetters(["i18n"])
  },
  watch: {
    checkedList: {
      handler(checkedList) {
        let value = [];
        // 监听当前显示的字段列表变化，然后通知table进行列调整
        if (checkedList.length) {
          this.columns.forEach(item => {
            const isHave = checkedList.some(sItem => sItem === item.dataIndex);
            item.checked = isHave;
            if (isHave) {
              value.push(item);
            }
          });
        }
        this.$emit("change", value);
      },
      immediate: true,
      deep: true
    }
  },
  created() {
    let keys = [];
    // 未指定要显示的字段时，从columns找设置了默认显示的字段
    if (!this.checkedList.length) {
      keys = this.columns
        .filter(item => item.checked)
        .map(item => item.dataIndex);
    }
    this.$emit("update:checkedList", keys);
  },
  methods: {
    // 自选列表变化
    onChange(checkedList) {
      this.indeterminate =
        !!checkedList.length && checkedList.length < this.columns.length;
      this.checkAll = checkedList.length === this.columns.length;
      this.handleOk(checkedList);
    },
    // 自定义列全选所有字段
    onCheckAllChange(e) {
      const checkedList = e.target.checked
        ? this.columns.map(item => item.dataIndex)
        : [];
      Object.assign(this, {
        indeterminate: false,
        checkAll: e.target.checked
      });
      this.handleOk(checkedList);
    },
    // 派发事件
    handleOk(checkedList, isEmit = true) {
      const value = [];
      this.columns.forEach(item => {
        const isHave = checkedList.some(sItem => sItem === item.dataIndex);
        item.checked = isHave;
        if (isHave) {
          value.push(item);
        }
      });
      if (isEmit) {
        this.$emit("update:checkedList", checkedList);
        this.$emit("setTableKeys", checkedList);
      }
      this.$emit("change", value);
    }
  }
};
</script>

<style scoped lang="less">
.customColumns {
}
</style>
