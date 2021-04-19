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
      <a-radio-group v-model="coinName" button-style="solid" @change="change">
        <a-radio-button
          :value="item.name"
          v-for="item in list"
          :key="item.name"
        >
          {{ item.name.toLocaleUpperCase() }}
        </a-radio-button>
      </a-radio-group>
      <p class="mt10 width-50 text-center">
        {{ coinName.toLocaleUpperCase() }}地址：
      </p>
      <p class="width-50">{{ data.link }}</p>
      <div class="mt5">
        <img :src="qrCodeUrl" style="width: 120px; height: 120px" />
      </div>
    </div>
  </a-modal>
</template>

<script>
import QRCode from "qrcode";

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
      coinName: "btc",
      qrCodeUrl: "",
      list: [
        {
          name: "btc",
          link: "bitcoin:17gouYkCP1VJ5Pr4gfmE18YYyPs2qMn52z",
          value: "17gouYkCP1VJ5Pr4gfmE18YYyPs2qMn52z"
        },
        {
          name: "eth",
          link: "ethereum:0xe64cA7fD290Ed9320eFde9684B7b460eF0444393",
          value: "0xe64cA7fD290Ed9320eFde9684B7b460eF0444393"
        }
      ]
    };
  },
  computed: {
    data() {
      return this.list.filter(item => item.name === this.coinName)[0];
    }
  },
  watch: {
    visible: {
      handler(val) {
        this.show = val;
      },
      immediate: true
    }
  },
  mounted() {
    this.change();
  },
  methods: {
    close() {
      this.$emit("update:visible", false);
    },
    change() {
      this.getImgUrl(this.data.value);
    },
    getImgUrl(value) {
      QRCode.toDataURL(
        value,
        {
          errorCorrectionLevel: "H",
          type: "image/jpeg",
          quality: 0.3,
          margin: 1,
          color: {
            dark: "#000",
            light: "#fff"
          }
        },
        (error, result) => {
          console.log(error, result);
          this.qrCodeUrl = result;
        }
      );
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
