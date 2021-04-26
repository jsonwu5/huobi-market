<template>
  <a-config-provider :locale="locale[userLang]">
    <div class="app">
      <div class="flex jsb ac tabs pr5">
        <a-tabs v-model="activeKey" class="flex-1">
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
        <a-dropdown>
          <a-menu slot="overlay" @click="openInTab">
            <a-menu-item key="1" v-if="openType !== 1">
              在标签页中打开
            </a-menu-item>
            <a-menu-item key="2" v-if="openType !== 2">
              以独立窗口打开
            </a-menu-item>
          </a-menu>
          <a-button shape="circle" icon="down"></a-button>
        </a-dropdown>
      </div>

      <div class="pt10 pb10 pr10 pl10">
        <market v-if="activeKey === 'market'" />
        <earnings v-if="activeKey === 'earnings'"></earnings>
        <setting v-if="activeKey === 'setting'"></setting>
      </div>
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
import { getQueryString } from "@tools";

export default {
  name: "App",
  components: { Setting, Earnings, Market },
  data() {
    return {
      locale: {
        zh_CN: zhCN,
        en: null
      },
      activeKey: "earnings"
    };
  },
  computed: {
    ...mapState(["userLang", "openType", "manifest"]),
    ...mapGetters(["i18n"])
  },
  watch: {
    i18n: {
      handler() {
        // 设置标签页/窗口标题
        document.title = `${this.i18n.extName || "火币行情助手"} - v${
          this.manifest.version
        }`;
      }
    }
  },
  created() {
    let openType = getQueryString("openType");
    openType = Number(openType);
    this._setOpenType(openType);

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
    ...mapMutations(["_setUserLang", "_setOpenType"]),
    openInTab(e) {
      // 以浏览器标签页打开
      if (e.key === "1") {
        chrome.tabs.create(
          {
            url: `${chrome.runtime.getURL("popup.html")}?openType=${e.key}`
          },
          e => {
            console.log(e);
          }
        );
      } else {
        // 以独立窗口打开
        chrome.windows.create(
          {
            url: `${chrome.runtime.getURL("popup.html")}?openType=${e.key}`,
            width: 900,
            height: 600,
            top: 200,
            type: "popup"
          },
          e => {
            console.log(e);
          }
        );
      }
    }
  }
};
</script>

<style scoped lang="less">
.app {
  transition: all 0.3s;
  .tabs {
    border-bottom: 1px solid #e8e8e8;
    background-color: white;
  }
  /deep/ .ant-tabs-bar {
    margin: 0;
    border-bottom: none;
  }
}
</style>
<style lang="less">
.app {
  height: 100%;
  background-color: #f8f8f8;
}
</style>
