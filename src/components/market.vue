<template>
  <div class="index pl15 pt15 pr15 pb15">
    <div>
      <a-select
        v-model="selectedCoin"
        class="width-100"
        mode="multiple"
        placeholder="请选择币种"
      >
        <a-select-option v-for="item in coins" :key="item">
          {{ item }}
        </a-select-option>
      </a-select>
      <a-button class="mt10" @click="addOptional">添加自选</a-button>
    </div>
    <div class="mt15 flex ac jsb">
      <div class="flex flex-column">
        <div class="f18">Coin</div>
        <div>OXT</div>
      </div>
      <div class="flex flex-column">
        <div class="f18">market</div>
        <div>10.5%</div>
      </div>
      <div class="flex flex-column">
        <div class="f18">price</div>
        <div>0.000152</div>
      </div>
    </div>
  </div>
</template>

<script>
import cookie from "js-cookie";

export default {
  name: "HelloWorld",
  data() {
    return {
      coins: [],
      selectedCoin: []
    };
  },
  mounted() {
    browser.runtime.sendMessage({});
  },
  computed: {
    defaultText() {
      return browser.i18n.getMessage("extName");
    }
  },
  created() {
    this.getCoinList();
  },
  methods: {
    // 获取支持的币种
    getCoinList() {
      this.$http.get("https://api.huobi.pro/v1/common/currencys").then(res => {
        this.coins = res;
      });
    },
    addOptional() {
      cookie.set("selectedCoin", JSON.stringify(this.selectedCoin));
      console.log(this.selectedCoin);
    },

  }
};
</script>

<style lang="less">
p {
  font-size: 20px;
}
</style>
