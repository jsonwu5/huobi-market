<template>
  <div class="customColumns">
    <a-modal title="自定义列" :visible="show" @ok="handleOk" @cancel="close()">
      <div>
        <div class="mb10" :style="{ borderBottom: '1px solid #E9E9E9' }">
          <a-checkbox
            :indeterminate="indeterminate"
            :checked="checkAll"
            @change="onCheckAllChange"
            >全选</a-checkbox
          >
        </div>
        <!-- 自定义列字段列表 -->
        <a-checkbox-group v-model="checkedList" @change="onChange">
          <a-row>
            <a-col
              class="mb5"
              :span="8"
              v-for="item in columns"
              :key="item.dataIndex"
            >
              <a-checkbox
                :value="item.dataIndex"
                :disabled="item.checkDisabled"
              >
                {{ item.title }}
              </a-checkbox>
            </a-col>
          </a-row>
        </a-checkbox-group>
      </div>
    </a-modal>
  </div>
</template>

<script>
export default {
  name: "customColumns",
  model: {
    prop: "value",
    event: "change"
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
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
      checkAll: false, // 是否全选所有字段
      show: false
    };
  },
  watch: {
    visible: {
      handler(val) {
        this.show = val;
      },
      immediate: true
    },
    value: {
      handler() {
        this.value.forEach(item => {
          this.checkedList.push(item.dataIndex);
        });
      },
      immediate: true
    }
  },
  methods: {
    close() {
      this.$emit("update:visible", false);
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
    },
    // 自选列表变化
    onChange(checkedList) {
      this.indeterminate =
        !!checkedList.length && checkedList.length < this.columns.length;
      this.checkAll = checkedList.length === this.columns.length;
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
      this.$emit("update:columns", list);
      this.$emit("change", value);
      this.close();
    }
  }
};
</script>

<style scoped lang="less">
.customColumns {
}
</style>
