<template>
  <a-config-provider :locale="zhCN">
    <div class="app">
      <market />
    </div>
  </a-config-provider>
</template>

<script>
import zhCN from "ant-design-vue/lib/locale-provider/zh_CN";
import Market from "@/components/market.vue";
import { mapActions, mapMutations, mapState } from "vuex";
import { getStorage } from "@/tools/storage.js";

export default {
  name: "App",
  components: { Market },
  data() {
    return {
      zhCN: zhCN
    };
  },
  computed: {
    ...mapState(["userLang"])
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

<style></style>
