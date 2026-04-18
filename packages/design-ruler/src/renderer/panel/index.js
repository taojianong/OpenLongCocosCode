// panel/index.js, this filename needs to match the one registered in package.json
const { BrowserWindow, globalShortcut, ipcMain } = require('electron');
const Fs = require('fs');
const Path = require('path');
const { join } = require('path');
const RendererUtil = require('../../utils/renderer-util');

// ⚠️ 2.4.5 以下版本只能通过 Editor.url 来获取插件路径
const PACKAGE_NAME = 'export_excel';
const PACKAGE_PATH = Editor.url(`packages://${PACKAGE_NAME}/`);
const DIR_PATH = join(PACKAGE_PATH, 'src/renderer/panel/');

var app;
var $list;

Editor.Panel.extend({
  // css style for panel
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
  `,

  // html template for panel
  // template: `
  //   <h2>export_excel</h2>
  //   <hr />
  //   <div>点击一下就导出:</div>
  //   <hr />
  //   <ui-button id="btn_all">全部导出</ui-button>
  //   <ui-button id="btn_bullet">Bullet子弹</ui-button>
  //   <ui-button id="btn_weapon">Weapon_武器</ui-button>
  //   <ui-button id="btn_entity">Entity_敌人</ui-button>
  //   <ui-button id="btn_lan_app">Language_app多语言翻译版</ui-button>
  //   <ui-button id="btn_lan">Language多语言</ui-button>
  //   <ui-button id="btn_shop">Shop商城章节礼包月卡等配置-雷</ui-button>
  // `,

  template: Fs.readFileSync(join(DIR_PATH, 'index.html'), 'utf8'),

  // element and variable binding
  $: {
    btn_all: '#btn_all',
    // btn_bullet: '#btn_bullet',
    // btn_weapon: '#btn_weapon',
    // btn_entity: '#btn_entity',
    // btn_lan: '#btn_lan',
    // btn_lan_app: '#btn_lan_app',
    // btn_shop: '#btn_shop',

    list: '#list'
  },

  // method executed when template and styles are successfully loaded and initialized
  ready() {

    // this.$btn_bullet.addEventListener('confirm', () => {
    //   Editor.Ipc.sendToMain('export_excel:export', this.$btn_bullet.innerText);
    // });

    // this.$btn_weapon.addEventListener('confirm', () => {
    //   Editor.Ipc.sendToMain('export_excel:export', this.$btn_weapon.innerText);
    // });

    // this.$btn_entity.addEventListener('confirm', () => {
    //   Editor.Ipc.sendToMain('export_excel:export', this.$btn_entity.innerText);
    // });

    // this.$btn_lan.addEventListener('confirm', () => {
    //   Editor.Ipc.sendToMain('export_excel:export', this.$btn_lan.innerText);
    // });

    // this.$btn_lan_app.addEventListener('confirm', () => {
    //   Editor.Ipc.sendToMain('export_excel:export', this.$btn_lan_app.innerText);
    // });

    // this.$btn_shop.addEventListener('confirm', () => {
    //   Editor.Ipc.sendToMain('export_excel:export', this.$btn_shop.innerText);
    // });

    $list = this.$list;

    // this.$btn_all.addEventListener('confirm', () => {
    //   Editor.Ipc.sendToMain('export_excel:export-all');
    // });

    app = new window.Vue({
      el: this.shadowRoot,
      data() {
        return {
          excellist: [],
          export_result: '',
          selectExcel: '',
          exportSheet: '正在导的sheet表',
        };
      },
      methods: {

        //刷新列表
        onConfirm(event) {
          event.stopPropagation();
          RendererUtil.print('log', `[index.js]===>刷新excel列表`);
          //获取最新列表
          Editor.Ipc.sendToMain('export_excel:getExcelList');
        },

        //刷新列表
        onExportAll(event) {
          event.stopPropagation();
          this.export_result = `正在导出全部表格...`;
          //获取最新列表
          Editor.Ipc.sendToMain('export_excel:export-all');
        },

        //选择并导出对应表格
        onSelect(item) {
          this.export_result = `开始导表[${item.name}]...`;
          RendererUtil.print('log', `[index.js]===>out excel item.name:${item.name}`);
          Editor.Ipc.sendToMain('export_excel:export', item.name, 'panel.export');
        },

        //获取excel列表
        setExcelList(event, datas) {

          datas = datas || { excellist: { files: [] } };

          RendererUtil.print('log', `[index.js]===>收到表格列表数据 excellist.lenght:${datas.excellist.files.length}  excellist:${datas.excellist}`);

          this.excellist.length = 0;
          for (let index = 0; index < datas.excellist.files.length; index++) {
            const element = datas.excellist.files[index];
            if (element) {
              const name = Path.basename(element).split('.')[0];
              // RendererUtil.print('log', `[index.js]===>setExcelList element:${element} name:${name}`);
              this.excellist.push({ name, url: element });
            }
          }
        },

        //导出成功
        exportSuccess(event, fileName) {
          RendererUtil.print('log', `[index.js]===>exportSuccess fileName:${fileName}`);
          this.export_result = `导表[${fileName}]完成.`;
        },

        //导表所有表格完成
        exportAllSuccess(event) {
          RendererUtil.print('log', `[index.js]===>exportAllSuccess.`);
          this.export_result = `导表所有表格完成.`;
        },
      },
      mounted() {//这个没生效
        // RendererUtil.send('print', { type: 'log', content: `[panel.js]===>mounted.` });
      }
    });

    // RendererUtil.on('getExcelList-reply', (event, datas) => {
    //   RendererUtil.print('log', `[index.js]===>getExcelList-reply datas:${datas}`);
    //   app.setExcelList(event, datas);
    // });
    Editor.Ipc.sendToMain('export_excel:getExcelList', true);
  },

  // register your ipc messages here
  messages: {

    'getExcelList-reply'(event, datas) {

      RendererUtil.print('log', `[index.js]===>getExcelList-reply 2 datas:${datas}`);

      app.setExcelList(event, datas);

      if (event.reply) {
        event.reply(null, '收到主线程发送信息 update-openlist.');
      }
    },

    //导出单个表格完成
    'export_success'(event, data) {

      app.exportSuccess(event, data);
    },

    //导出所有表格完成
    'export_all_success'(event, data) {

      app.exportAllSuccess(event, data);
    },
  }
});