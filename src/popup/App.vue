<template>
  <a-config-provider :locale="zhCN">
    <div class="app pt15 pb15">
      <!--插件版本信息-->
      <a-space class="pl15 pr15">
        <span class="bold f16">{{ i18n.extName || "火币行情助手" }}</span>
        <span>{{ i18n.extVersion || "当前版本" }}:{{ manifest.version }}</span>
        <span v-if="false" @click="feedback" class="pointer">吐个槽</span>
        <a-button class="githubBtn flex ac" @click="goGithub()">
          <svg
            class="githubIcon"
            height="24"
            viewBox="0 0 16 16"
            version="1.1"
            width="24"
            aria-hidden="true"
          >
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
            /></svg
          ><span class="ml5">{{ i18n.sourceCode || "源代码" }}</span></a-button
        >
        <a-radio-group v-model="page">
          <a-radio-button value="market">
            行情市场
          </a-radio-button>
          <a-radio-button value="earnings">
            收益分析
          </a-radio-button>
        </a-radio-group>
      </a-space>
      <market v-if="page === 'market'" />
      <earnings v-if="page === 'earnings'"></earnings>
    </div>
  </a-config-provider>
</template>

<script>
import zhCN from "ant-design-vue/lib/locale-provider/zh_CN";
import Market from "@/components/market.vue";
import { mapActions, mapGetters, mapMutations, mapState } from "vuex";
import { getStorage } from "@/tools/storage.js";
import Earnings from "@components/earnings";

export default {
  name: "App",
  components: { Earnings, Market },
  data() {
    return {
      zhCN: zhCN,
      page: "market"
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
    ...mapMutations(["_setUserLang"]),
    goGithub() {
      chrome.tabs.create({ url: "https://github.com/jsonwu5/huobi-market" });
    },
    feedback() {
      chrome.tabs.create({ url: "https://support.qq.com/product/313772" });
    }
  }
};
</script>

<style lang="less">
.app {
  transition: all 0.3s;
  .githubBtn {
    border: none;
    padding: 5px;
  }
}
</style>
