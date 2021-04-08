<template>
  <a-config-provider :locale="zhCN">
    <div class="app">
      <a-tabs v-model="activeKey">
        <a-tab-pane key="market">
          <span slot="tab">
            <a-icon type="sliders" />
            实时行情
          </span>
        </a-tab-pane>
        <a-tab-pane key="earnings">
          <span slot="tab">
            <a-icon type="bar-chart" />
            收益分析
          </span>
        </a-tab-pane>
        <a-tab-pane key="setting">
          <span slot="tab">
            <a-icon type="setting" />
            设置
          </span>
        </a-tab-pane>
      </a-tabs>

      <market v-if="activeKey === 'market'" />
      <earnings v-if="activeKey === 'earnings'"></earnings>
      <setting v-if="activeKey === 'setting'"></setting>
    </div>
  </a-config-provider>
</template>

<script>
import zhCN from "ant-design-vue/lib/locale-provider/zh_CN";
import Market from "@/components/market.vue";
import { mapActions, mapGetters, mapMutations, mapState } from "vuex";
import { getStorage } from "@/tools/storage.js";
import Earnings from "@components/earnings";
import Setting from "@components/setting";

export default {
  name: "App",
  components: { Setting, Earnings, Market },
  data() {
    return {
      zhCN: zhCN,
      activeKey: "market"
    };
  },
  computed: {
    ...mapState(["manifest", "userLang"]),
    ...mapGetters(["i18n"])
  },
  created() {
    getStorage("userLang").then(res => {
      this._setUserLang(res.userLang);
      if (!this.userLang) {
        // 设置为空时获取用户浏览器设置的语言
        let userLang = chrome.i18n.getUILanguage();
        // 处理zh-CN这种情况
        this._setUserLang(userLang.split("-").join("_"));
      }
      this._getManifest();
      this._getLanguageAll();
    });
  },
  methods: {
    ...mapActions(["_getManifest", "_getLanguageAll"]),
    ...mapMutations(["_setUserLang"])
  }
};
</script>

<style lang="less">
.app {
  transition: all 0.3s;
  .ant-tabs-bar {
    margin: 0;
  }
}
</style>
