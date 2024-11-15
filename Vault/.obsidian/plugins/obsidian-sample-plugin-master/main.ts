import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf } from 'obsidian';
import type { MarkdownFileInfo } from 'obsidian';
import ExampleView from "./src/ExampleView.svelte";
import { count } from './src/store';
import { get } from 'svelte/store';

// 添加类型声明
declare module 'obsidian' {
    interface MenuItem {
        setSubmenu: () => Menu;
    }
}

// 在 HelloWorldPlugin 类中添加这个常量
export const VIEW_TYPE_EXAMPLE = "example-view";

// Remember to rename these classes and interfaces!

interface HelloWorldPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: HelloWorldPluginSettings = {
	mySetting: 'default'
}

export default class HelloWorldPlugin extends Plugin {
	settings: HelloWorldPluginSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('你好啊');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		// 注册视图
		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleItemView(leaf)
		);

		// 添加打开视图的命令
		this.addCommand({
			id: 'open-example-view',
			name: '打开示例视图',
			callback: () => {
				this.activateView();
			}
		});

		// 添加增加计数的命令
		this.addCommand({
			id: 'increment-count',
			name: '增加计数',
			callback: () => {
				count.update(n => n + 1);
				new Notice(`当前计数：${get(count)}`);
			}
		});

		// 添加编辑器右键菜单
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				menu.addItem((item) => {
					const submenu = item.setTitle('工作报告')
						.setSection('action')
						.setSubmenu();

					submenu.addItem((item) => {
						item.setTitle('显示')
							.setIcon('eye')
							.onClick(async () => {
								const selection = editor.getSelection();
								if (selection) {
									new Notice(`选中的文本：${selection}`);
								} else {
									new Notice('没有选中任何文本');
								}
							});
					});
				});
			})
		);
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// 在 HelloWorldPlugin 类中添加这个方法
	async activateView() {
		const { workspace } = this.app;
		
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0];
		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (!rightLeaf) return;
			leaf = rightLeaf;
			await leaf.setViewState({
				type: VIEW_TYPE_EXAMPLE,
				active: true,
			});
		}
		
		workspace.revealLeaf(leaf);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: HelloWorldPlugin;

	constructor(app: App, plugin: HelloWorldPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

// 创建一个新的视图类
class ExampleItemView extends ItemView {
	component!: ExampleView;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return "Example View";
	}

	async onOpen() {
		// 添加一些调试信息
		console.log("Opening view...");
		this.contentEl.empty();  // 清空容器
		this.contentEl.createEl("p", { text: "Loading..." });  // 添加加载提示

		try {
			this.component = new ExampleView({
				target: this.contentEl,
				props: {
					name: "Obsidian"
				}
			});
			console.log("Component mounted successfully");
		} catch (error) {
			console.error("Error mounting component:", error);
			this.contentEl.empty();
			this.contentEl.createEl("p", { text: "Error loading component" });
		}
	}

	async onClose() {
		if (this.component) {
			this.component.$destroy();
		}
	}
}
