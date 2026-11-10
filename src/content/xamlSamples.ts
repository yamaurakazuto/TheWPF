/** XAML ビューア / 演習場で使うサンプル。すべて実際の WPF でそのまま読み込める XAML */
export interface XamlSample {
  id: string
  label: string
  /** 何を見るためのサンプルか */
  point: string
  xaml: string
}

const NS = `xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"`

export const xamlSamples: XamlSample[] = [
  {
    id: 'stack',
    label: 'StackPanel',
    point: '子要素を上から順に積む、いちばん単純なレイアウト。Margin と HorizontalAlignment の効き方を見る。',
    xaml: `<Window ${NS}
        Title="Hello WPF" Width="320" Height="190">
    <StackPanel Margin="16">
        <TextBlock Text="お名前" FontWeight="Bold" />
        <TextBox Margin="0,4,0,12" Text="WPF" />
        <Button Content="あいさつする" HorizontalAlignment="Left" Padding="12,4" />
    </StackPanel>
</Window>`,
  },
  {
    id: 'grid',
    label: 'Grid',
    point: '行と列を定義し、添付プロパティ Grid.Row / Grid.Column で置き場所を指定する。Auto と *（残り全部）の違いに注目。',
    xaml: `<Window ${NS}
        Title="ユーザー登録" Width="360" Height="220">
    <Grid Margin="16">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="Auto" />
            <ColumnDefinition Width="*" />
        </Grid.ColumnDefinitions>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="Auto" />
            <RowDefinition Height="*" />
            <RowDefinition Height="Auto" />
        </Grid.RowDefinitions>

        <TextBlock Grid.Row="0" Grid.Column="0" Text="名前" VerticalAlignment="Center" Margin="0,0,12,8" />
        <TextBox Grid.Row="0" Grid.Column="1" Margin="0,0,0,8" />
        <TextBlock Grid.Row="1" Grid.Column="0" Text="メール" VerticalAlignment="Center" Margin="0,0,12,8" />
        <TextBox Grid.Row="1" Grid.Column="1" Margin="0,0,0,8" />
        <CheckBox Grid.Row="2" Grid.Column="1" Content="お知らせを受け取る" VerticalAlignment="Top" />
        <StackPanel Grid.Row="3" Grid.Column="0" Grid.ColumnSpan="2"
                    Orientation="Horizontal" HorizontalAlignment="Right">
            <Button Content="キャンセル" Width="88" Margin="0,0,8,0" />
            <Button Content="登録" Width="88" IsDefault="True" />
        </StackPanel>
    </Grid>
</Window>`,
  },
  {
    id: 'dock',
    label: 'DockPanel',
    point: '上下左右に「貼り付け」ていき、最後の子が残りを埋める。アプリの骨格（メニュー・ステータスバー・ナビ）に向く。',
    xaml: `<Window ${NS}
        Title="メール" Width="380" Height="230">
    <DockPanel>
        <Menu DockPanel.Dock="Top">
            <MenuItem Header="ファイル(_F)" />
            <MenuItem Header="編集(_E)" />
            <MenuItem Header="ヘルプ(_H)" />
        </Menu>
        <StatusBar DockPanel.Dock="Bottom">
            <StatusBarItem Content="準備完了" />
        </StatusBar>
        <ListBox DockPanel.Dock="Left" Width="110" SelectedIndex="0">
            <ListBoxItem Content="受信トレイ" />
            <ListBoxItem Content="下書き" />
            <ListBoxItem Content="送信済み" />
        </ListBox>
        <TextBox Text="最後の子要素が残りの領域を埋めます"
                 TextWrapping="Wrap" AcceptsReturn="True" />
    </DockPanel>
</Window>`,
  },
  {
    id: 'resource',
    label: 'リソース',
    point: 'ブラシを Window.Resources に 1 回だけ定義し、キーで何度も参照する。Color の値を変えると参照先すべてが変わる。',
    xaml: `<Window ${NS}
        Title="リソース" Width="320" Height="180">
    <Window.Resources>
        <SolidColorBrush x:Key="PanelBrush" Color="#FFEFEAFB" />
        <SolidColorBrush x:Key="AccentBrush" Color="#FF5235C9" />
    </Window.Resources>

    <Border Margin="16" Padding="16" CornerRadius="8" BorderThickness="2"
            Background="{StaticResource PanelBrush}"
            BorderBrush="{StaticResource AccentBrush}">
        <StackPanel>
            <TextBlock Text="同じブラシを 3 か所で使う" FontSize="14" FontWeight="Bold"
                       Foreground="{StaticResource AccentBrush}" />
            <Rectangle Height="4" Margin="0,8" Fill="{StaticResource AccentBrush}" />
            <TextBlock Text="キーを 1 つ直せば全部変わる" />
        </StackPanel>
    </Border>
</Window>`,
  },
  {
    id: 'style',
    label: 'Style と Trigger',
    point: 'x:Key のない Style は「暗黙スタイル」として同じ型すべてに効く。ローカル値はスタイルより強い。ボタンにカーソルを載せてトリガーを確かめる。',
    xaml: `<Window ${NS}
        Title="スタイルとトリガー" Width="340" Height="220">
    <Window.Resources>
        <!-- x:Key なし = 暗黙スタイル。この Window 内のすべての Button に適用される -->
        <Style TargetType="Button">
            <Setter Property="Margin" Value="0,0,0,8" />
            <Setter Property="Padding" Value="14,6" />
            <Setter Property="FontSize" Value="13" />
            <Style.Triggers>
                <Trigger Property="IsMouseOver" Value="True">
                    <Setter Property="FontWeight" Value="Bold" />
                </Trigger>
            </Style.Triggers>
        </Style>

        <!-- BasedOn で暗黙スタイルを引き継ぎ、一部だけ上書きする -->
        <Style x:Key="DangerButton" TargetType="Button"
               BasedOn="{StaticResource {x:Type Button}}">
            <Setter Property="Foreground" Value="#C02A55" />
        </Style>
    </Window.Resources>

    <StackPanel Margin="16" HorizontalAlignment="Left">
        <Button Content="保存" />
        <Button Content="削除" Style="{StaticResource DangerButton}" />
        <!-- ローカル値はスタイルの Setter にもトリガーにも勝つ -->
        <Button Content="ローカル値が最優先" FontWeight="Normal" Foreground="Gray" />
    </StackPanel>
</Window>`,
  },
]
