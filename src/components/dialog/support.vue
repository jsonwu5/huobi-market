<template>
  <!-- 赞助作者 -->
  <a-modal
    title="支持我"
    wrapClassName="support"
    :visible="show"
    @cancel="close()"
    centered
    :footer="null"
  >
    <div class="wrap flex flex-column ac">
      <a-radio-group v-model="coinName" button-style="solid">
        <a-radio-button value="btc">
          BTC
        </a-radio-button>
        <a-radio-button value="bch">
          BCH
        </a-radio-button>
        <a-radio-button value="eth">
          ETH
        </a-radio-button>
        <a-radio-button value="ltc">
          LTC
        </a-radio-button>
      </a-radio-group>
      <p class="mt10">{{ coinName.toLocaleUpperCase() }}地址：</p>
      <p></p>
      <div class="mt5">图片</div>
    </div>
  </a-modal>
</template>

<script>
export default {
  name: "support",
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      show: false,
      coinName: "btc"
    };
  },
  watch: {
    visible: {
      handler(val) {
        this.show = val;
      },
      immediate: true
    }
  },
  created() {},
  methods: {
    close() {
      this.$emit("update:visible", false);
    }
  }
};
</script>

<style lang="less">
.support {
  .wrap {
    height: 300px;
  }
  .ant-modal-body {
    padding: 15px 10px;
  }
}
</style>
