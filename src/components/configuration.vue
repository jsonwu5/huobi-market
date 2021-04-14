<template>
  <!--功能设置-->
  <div class="configuration pt15 pl15 pr15 pb15">
    <div class="flex ac mb10 pointer" @click="$emit('back')">
      <a-icon class="mr5" type="left" />返回
    </div>
    <div class="flex ac jsb mb15">
      <div>语言设置：</div>
      <a-select :value="userLang" style="width: 120px" @change="langChange">
        <a-select-option
          v-for="item in langList"
          :value="item.lang"
          :key="item.lang"
        >
          {{ item.name }}
        </a-select-option>
      </a-select>
    </div>
    <div class="flex ac jsb mb15">
      <div>价格颜色：</div>
      <a-switch
        :checked-children="i18n.upsColorRed || '红涨'"
        :un-checked-children="i18n.upsColorGreen || '绿涨'"
        :checked="upsColor"
        @change="switchChange"
      />
    </div>

    <p class="mb10">配置文件导入导出</p>
    <div class="flex ac mb15">
      <a-upload
        accept=".json"
        name="file"
        :multiple="false"
        :before-upload="uploadConfig"
        :show-upload-list="false"
      >
        <a-button class="mr10">{{ i18n.importConfig || "导入配置" }}</a-button>
      </a-upload>
      <a-button @click="downloadConfig">{{
        i18n.exportConfig || "导出配置"
      }}</a-button>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations, mapState } from "vuex";
import { getStorage, KYELIST } from "@tools/storage";
import FileSaver from "file-saver";

export default {
  name: "configuration",
  data() {
    return {
      langList: [
        {
          name: "中文",
          lang: "zh_CN"
        },
        {
          name: "English",
          lang: "en"
        }
      ]
    };
  },
  computed: {
    ...mapState([
      "tableKeys",
      "myCoinList",
      "stickList",
      "upsColor",
      "badgeCoin",
      "sortConfig",
      "userLang",
      "tableWidths"
    ]),
    ...mapGetters(["i18n"])
  },
  created() {},
  methods: {
    ...mapMutations(["_setUserLang", "_setUpsColor"]),
    ...mapActions(["_getLanguageAll", "_importConfig"]),
    // 切换语言
    langChange(val) {
      this._setUserLang(val);
      this._getLanguageAll();
    },
    switchChange(e) {
      this._setUpsColor(e);
      // 通知角标重新初始化
      chrome.runtime.sendMessage({
        type: "refreshBadge"
      });
    },
    // 导出配置文件
    downloadConfig() {
      getStorage(KYELIST).then(res => {
        // 将json转换成字符串
        const data = JSON.stringify(res, null, 2);
        const blob = new Blob([data], { type: "" });
        FileSaver.saveAs(blob, "Huobi_market_config.json");
      });
    },
    // 导入配置文件
    uploadConfig(file) {
      // console.log(file);
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = event => {
        // console.log(event);
        try {
          const data = JSON.parse(event.target.result);
          this._importConfig(data);
        } catch (e) {
          console.log(e);
          throw new Error(e);
        }
        // 检测是否导入成功
      };
      return false;
    }
  }
};
</script>

<style scoped lang="less">
.configuration {
  /deep/ .ant-switch {
    background-color: #39c38c;
  }
  /deep/ .ant-switch-checked {
    background-color: #ff704b;
  }
}
</style>
