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
import { mapActions } from "vuex";

export default {
  name: "App",
  components: { Market },
  data() {
    return {
      zhCN: zhCN
    };
  },
  created() {
    this._getManifest();
  },
  methods: {
    ...mapActions(["_getManifest"])
  }
};
</script>

<style></style>
