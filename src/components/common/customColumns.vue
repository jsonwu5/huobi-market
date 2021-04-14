<template>
  <div class="customColumns">
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
      <slot>
        <a-icon class="pointer f18 mr20" type="menu" />
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
    }
  },
  data() {
    return {
      indeterminate: true, // 设置 indeterminate 状态，只负责样式控制
      checkedList: [], // 选择的字段列表
      checkAll: false // 是否全选所有字段
    };
  },
  computed: {
    ...mapGetters(["i18n"])
  },
  watch: {
    value: {
      handler() {
        this.checkedList = [];
        this.value.forEach(item => {
          this.checkedList.push(item.dataIndex);
        });
      },
      immediate: true
    }
  },
  methods: {
    // 自选列表变化
    onChange(checkedList) {
      this.indeterminate =
        !!checkedList.length && checkedList.length < this.columns.length;
      this.checkAll = checkedList.length === this.columns.length;
      this.handleOk();
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
      this.handleOk();
      // this._setTableKeys(this.checkedList);
    },
    handleOk() {
      const list = this.columns;
      const value = [];
      list.forEach(item => {
        const isHave = this.checkedList.some(sItem => sItem === item.dataIndex);
        item.checked = isHave;
        if (isHave) {
          value.push(item);
        }
      });
      this.$emit("change", value);
      this.$emit("update", this.checkedList);
    }
  }
};
</script>

<style scoped lang="less">
.customColumns {
}
</style>
