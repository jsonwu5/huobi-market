<template>
  <div class="setting">
    <div class="list mt20">
      <template v-for="(item, index) in list">
        <div class="item flex ac jsb pl15 pr15 pt10 pb10 pointer" :key="index">
          <div>
            <a-icon :type="item.icon" /><span class="ml5">{{ item.name }}</span>
          </div>
          <a-icon :size="16" type="right" />
        </div>
        <a-divider style="margin: 0" :key="index" />
      </template>
    </div>
    <!--插件版本信息-->
    <a-space class="pl15 pr15" v-if="false">
      <span class="bold f16">{{ i18n.extName || "火币行情助手" }}</span>
      <span>{{ i18n.extVersion || "当前版本" }}:{{ manifest.version }}</span>
      <a-button class="githubBtn flex ac" @click="goGithub()">
        <a-icon class="f18" type="github" /><span class="ml5">{{
          i18n.sourceCode || "源代码"
        }}</span></a-button
      >
    </a-space>
    <div v-if="false">
      <a-icon type="message" />
      <span @click="feedback()" class="pointer ml5">吐个槽</span>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";

export default {
  name: "setting",
  data() {
    return {
      list: [
        {
          name: "功能设置",
          icon: "setting",
          url: ""
        },
        {
          name: "关于我们",
          icon: "team",
          url: ""
        }
      ]
    };
  },
  computed: {
    ...mapState(["manifest", "userLang"]),
    ...mapGetters(["i18n"])
  },
  created() {},
  methods: {
    goGithub() {
      chrome.tabs.create({ url: "https://github.com/jsonwu5/huobi-market" });
    },
    feedback() {
      chrome.tabs.create({ url: "https://support.qq.com/product/313772" });
    }
  }
};
</script>

<style scoped lang="less">
.setting {
  overflow: auto;
  min-width: 380px;
  min-height: 500px;
  max-height: 500px;
  max-width: 800px;
  transition: all 0.3s;
  background-color: #f5f5f5;
  .githubBtn {
    border: none;
    padding: 5px;
  }
  .list {
    background-color: white;
  }
}
</style>
