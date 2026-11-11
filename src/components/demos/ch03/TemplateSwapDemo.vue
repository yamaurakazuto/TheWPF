<script setup lang="ts">
import { computed, ref } from 'vue'
import CodeBlock from '@/components/content/CodeBlock.vue'

/**
 * ControlTemplate の差し替えを体験するデモ。
 * 同じ Button（同じ Click、同じ Background プロパティ）のまま、テンプレートだけを入れ替える。
 * 「動作はコントロール、見た目はテンプレート」という分担を確かめる。
 */
const TEMPLATES = [
  {
    id: 'default',
    label: '既定（Aero2）',
    note: '既定テンプレートは、ホバー / 押下時にテンプレート内のトリガーが Border の色を直接書き換える。そのため Background に何色を指定していても、ホバー中は水色になる。',
    xaml: `<!-- 既定テンプレート（Aero2）の要点を抜き出したもの -->
<ControlTemplate TargetType="Button">
    <Border x:Name="border"
            Background="{TemplateBinding Background}"
            BorderBrush="{TemplateBinding BorderBrush}"
            BorderThickness="{TemplateBinding BorderThickness}"
            SnapsToDevicePixels="True">
        <ContentPresenter Margin="{TemplateBinding Padding}"
                          HorizontalAlignment="{TemplateBinding HorizontalContentAlignment}"
                          VerticalAlignment="{TemplateBinding VerticalContentAlignment}" />
    </Border>
    <ControlTemplate.Triggers>
        <Trigger Property="IsMouseOver" Value="True">
            <!-- TargetName で内側の Border を直接書き換えている -->
            <Setter TargetName="border" Property="Background" Value="#FFBEE6FD" />
            <Setter TargetName="border" Property="BorderBrush" Value="#FF3C7FB1" />
        </Trigger>
        <Trigger Property="IsPressed" Value="True">
            <Setter TargetName="border" Property="Background" Value="#FFC4E5F6" />
            <Setter TargetName="border" Property="BorderBrush" Value="#FF2C628B" />
        </Trigger>
    </ControlTemplate.Triggers>
</ControlTemplate>`,
  },
  {
    id: 'pill',
    label: 'ピル型',
    note: 'Border の角を丸めただけ。ホバー時は色を変えずに不透明度だけ下げているので、Background に指定した色がそのまま活きる。',
    xaml: `<ControlTemplate TargetType="Button">
    <Border x:Name="Chrome"
            Background="{TemplateBinding Background}"
            CornerRadius="16"
            Padding="{TemplateBinding Padding}">
        <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center" />
    </Border>
    <ControlTemplate.Triggers>
        <Trigger Property="IsMouseOver" Value="True">
            <Setter TargetName="Chrome" Property="Opacity" Value="0.85" />
        </Trigger>
        <Trigger Property="IsPressed" Value="True">
            <Setter TargetName="Chrome" Property="Opacity" Value="0.7" />
        </Trigger>
        <Trigger Property="IsEnabled" Value="False">
            <Setter TargetName="Chrome" Property="Opacity" Value="0.4" />
        </Trigger>
    </ControlTemplate.Triggers>
</ControlTemplate>`,
  },
  {
    id: 'card',
    label: 'カード型',
    note: 'テンプレートには好きな要素を置ける。ここでは左に色付きの丸、右に Content を並べた。Background は丸の色として使っている。',
    xaml: `<ControlTemplate TargetType="Button">
    <Border x:Name="Chrome" Background="White" BorderBrush="#CCCCD6"
            BorderThickness="1" CornerRadius="8" Padding="12,8">
        <StackPanel Orientation="Horizontal">
            <!-- Background を「丸の色」として使う。意味づけはテンプレート次第 -->
            <Ellipse Width="12" Height="12" Margin="0,0,10,0"
                     Fill="{TemplateBinding Background}" VerticalAlignment="Center" />
            <ContentPresenter VerticalAlignment="Center"
                              TextElement.Foreground="#17171F" />
        </StackPanel>
    </Border>
    <ControlTemplate.Triggers>
        <Trigger Property="IsMouseOver" Value="True">
            <Setter TargetName="Chrome" Property="BorderBrush"
                    Value="{Binding Background, RelativeSource={RelativeSource TemplatedParent}}" />
        </Trigger>
        <Trigger Property="IsEnabled" Value="False">
            <Setter TargetName="Chrome" Property="Opacity" Value="0.4" />
        </Trigger>
    </ControlTemplate.Triggers>
</ControlTemplate>`,
  },
] as const

const COLORS = [
  { name: 'MediumSlateBlue', css: '#7b68ee' },
  { name: 'SeaGreen', css: '#2e8b57' },
  { name: 'Crimson', css: '#dc143c' },
]

const tpl = ref<(typeof TEMPLATES)[number]['id']>('default')
const color = ref(COLORS[0])
const enabled = ref(true)
const clicks = ref(0)

const current = computed(() => TEMPLATES.find((t) => t.id === tpl.value)!)
const TEMPLATE_KEY = { default: null, pill: 'PillTemplate', card: 'CardTemplate' } as const
const usage = computed(() => {
  const key = TEMPLATE_KEY[tpl.value]
  return [
    '<Button Content="保存する" Click="OnSave"',
    `        Background="${color.value.name}" Foreground="White"${enabled.value ? '' : ' IsEnabled="False"'}${key ? '' : ' />'}`,
    ...(key ? [`        Template="{StaticResource ${key}}" />`] : []),
  ].join('\n')
})
</script>

<template>
  <div class="ts">
    <div class="controls">
      <div class="seg" role="group" aria-label="テンプレート">
        <button v-for="t in TEMPLATES" :key="t.id" type="button" :aria-pressed="tpl === t.id" @click="tpl = t.id">{{ t.label }}</button>
      </div>
      <div class="ts__colors" role="group" aria-label="Background プロパティ">
        <span class="small muted">Background:</span>
        <button v-for="c in COLORS" :key="c.name" type="button" class="ts__color" :class="{ 'is-on': color.name === c.name }" :style="{ background: c.css }" :aria-pressed="color.name === c.name" :aria-label="c.name" :title="c.name" @click="color = c" />
      </div>
      <label class="check"><input v-model="enabled" type="checkbox" /> IsEnabled</label>
    </div>

    <div class="ts__stage">
      <button type="button" class="ts__button" :class="`ts__button--${tpl}`" :style="{ '--btn': color.css }" :disabled="!enabled" @click="clicks++">
        <span v-if="tpl === 'card'" class="ts__dot" aria-hidden="true" />
        保存する
      </button>
      <p class="ts__clicks" aria-live="polite">
        Click イベント: <b>{{ clicks }}</b> 回
        <small>テンプレートを替えても、クリックの動作・キーボード操作・IsEnabled の意味は変わらない</small>
      </p>
    </div>

    <p class="ts__note">{{ current.note }}</p>

    <CodeBlock :code="usage" lang="xaml" title="使う側（共通）" excerpt />
    <CodeBlock :code="current.xaml" lang="xaml" :title="`テンプレート: ${current.label}`" excerpt />
  </div>
</template>

<style scoped>
.ts {
  display: grid;
  gap: var(--sp-3);
}
.ts__colors {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ts__color {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid var(--bg-raised);
  box-shadow: 0 0 0 1px var(--line-strong);
  padding: 0;
}
.ts__color.is-on {
  box-shadow: 0 0 0 3px var(--accent);
}
.ts__stage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-4) var(--sp-6);
  padding: var(--sp-5);
  border-radius: var(--radius-m);
  border: 1px solid #c8c8d0;
  background: #fff;
  color: #17171f;
  min-height: 116px;
}
.ts__clicks {
  font-size: var(--fs-sm);
  line-height: 1.6;
}
.ts__clicks small {
  display: block;
  color: #55556a;
  font-size: var(--fs-xs);
}
.ts__note {
  font-size: var(--fs-sm);
  color: var(--ink-2);
  min-height: 3.4em;
}

/* ── 3 種類のテンプレートの見た目（XAML の内容を CSS で再現） ── */
.ts__button {
  font: inherit;
  font-size: 14px;
  color: #fff;
  cursor: default;
}
.ts__button--default {
  background: var(--btn);
  border: 1px solid #707070;
  padding: 4px 14px;
}
.ts__button--default:hover:not(:disabled) {
  background: #bee6fd;
  border-color: #3c7fb1;
}
.ts__button--default:active:not(:disabled) {
  background: #c4e5f6;
  border-color: #2c628b;
}
.ts__button--default:disabled {
  background: #f4f4f4;
  border-color: #adb2b5;
  color: #838383;
}
.ts__button--pill {
  background: var(--btn);
  border: 0;
  border-radius: 16px;
  padding: 7px 20px;
}
.ts__button--pill:hover:not(:disabled) {
  opacity: 0.85;
}
.ts__button--pill:active:not(:disabled) {
  opacity: 0.7;
}
.ts__button--pill:disabled,
.ts__button--card:disabled {
  opacity: 0.4;
}
.ts__button--card {
  display: inline-flex;
  align-items: center;
  background: #fff;
  color: #17171f;
  border: 1px solid #ccccd6;
  border-radius: 8px;
  padding: 8px 12px;
}
.ts__button--card:hover:not(:disabled) {
  border-color: var(--btn);
}
.ts__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--btn);
  margin-right: 10px;
}
</style>
