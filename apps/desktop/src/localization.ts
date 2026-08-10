import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LOCALES = ['en-US', 'pt-BR', 'zh-CN'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const resolveLocale = (
  preferred: string | undefined,
  systemLocale: string,
): SupportedLocale => {
  const normalized = (preferred ?? systemLocale).toLowerCase();
  if (normalized === 'pt' || normalized.startsWith('pt-br')) return 'pt-BR';
  if (normalized === 'zh-cn' || normalized === 'zh-sg' || normalized.startsWith('zh-hans'))
    return 'zh-CN';
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en-US';
  return 'en-US';
};

const en = {
  translation: {
    addGame: 'Add game',
    allGames: 'All games',
    archive: 'Archive',
    artwork: 'Artwork',
    backLibrary: 'Back to library',
    consoleAction: 'console action',
    disconnected: 'Disconnected device',
    emptyAction: 'Choose a local ROM',
    emptyBody: 'Add your own .gb or .gbc files. Your library stays private on this computer.',
    emptyTitle: 'Your archive is ready',
    errorTitle: 'Something interrupted the flow',
    favorites: 'Favorites',
    feedbackSounds: 'Feedback sounds',
    gameControls: 'Game controls',
    importError: 'The game could not be imported.',
    inputSettings: 'Input settings',
    interfaceAudio: 'Interface audio',
    interfaceLanguage: 'Interface language',
    language: 'Language',
    library: 'Library',
    loading: 'Restoring your archive…',
    localPrivate: 'Original local file · Private by design',
    muteUiSounds: 'Mute interface sounds',
    nowPlaying: 'Now playing',
    pause: 'Pause',
    play: 'Play now',
    playerOneDevice: 'Player one device',
    ready: 'Ready',
    readyToPlay: 'Ready to play',
    recent: 'Recently played',
    resume: 'Resume',
    search: 'Search your library',
    sessionReady: 'Ready when you are',
    settings: 'Settings',
    statusPaused: 'Paused',
    statusRunning: 'Session running',
    statusStarting: 'Starting',
    stop: 'Exit game',
    tryAgain: 'Try again',
    volume: 'Volume',
  },
};
const pt = {
  translation: {
    addGame: 'Adicionar jogo',
    allGames: 'Todos os jogos',
    archive: 'Arquivo',
    artwork: 'Capa',
    backLibrary: 'Voltar à biblioteca',
    consoleAction: 'ação do console',
    disconnected: 'Dispositivo desconectado',
    emptyAction: 'Escolher uma ROM local',
    emptyBody:
      'Adicione seus arquivos .gb ou .gbc. Sua biblioteca permanece privada neste computador.',
    emptyTitle: 'Seu arquivo está pronto',
    errorTitle: 'Algo interrompeu o fluxo',
    favorites: 'Favoritos',
    feedbackSounds: 'Sons de feedback',
    gameControls: 'Controles do jogo',
    importError: 'Não foi possível importar o jogo.',
    inputSettings: 'Configurações de controle',
    interfaceAudio: 'Áudio da interface',
    interfaceLanguage: 'Idioma da interface',
    language: 'Idioma',
    library: 'Biblioteca',
    loading: 'Restaurando seu arquivo…',
    localPrivate: 'Arquivo local original · Privado por design',
    muteUiSounds: 'Silenciar sons da interface',
    nowPlaying: 'Jogando agora',
    pause: 'Pausar',
    play: 'Jogar agora',
    playerOneDevice: 'Dispositivo do jogador 1',
    ready: 'Pronto',
    readyToPlay: 'Pronto para jogar',
    recent: 'Jogados recentemente',
    resume: 'Continuar',
    search: 'Buscar na biblioteca',
    sessionReady: 'Tudo pronto para jogar',
    settings: 'Configurações',
    statusPaused: 'Pausado',
    statusRunning: 'Sessão em andamento',
    statusStarting: 'Iniciando',
    stop: 'Sair do jogo',
    tryAgain: 'Tentar novamente',
    volume: 'Volume',
  },
};
const zh = {
  translation: {
    addGame: '添加游戏',
    allGames: '所有游戏',
    archive: '档案',
    artwork: '封面',
    backLibrary: '返回游戏库',
    consoleAction: '主机操作',
    disconnected: '设备已断开',
    emptyAction: '选择本地 ROM',
    emptyBody: '添加您自己的 .gb 或 .gbc 文件。游戏库仅保存在此电脑上。',
    emptyTitle: '您的游戏档案已准备好',
    errorTitle: '操作被中断',
    favorites: '收藏',
    feedbackSounds: '反馈音效',
    gameControls: '游戏控制',
    importError: '无法导入游戏。',
    inputSettings: '输入设置',
    interfaceAudio: '界面音频',
    interfaceLanguage: '界面语言',
    language: '语言',
    library: '游戏库',
    loading: '正在恢复游戏档案…',
    localPrivate: '原始本地文件 · 隐私优先',
    muteUiSounds: '静音界面音效',
    nowPlaying: '正在游戏',
    pause: '暂停',
    play: '开始游戏',
    playerOneDevice: '玩家一设备',
    ready: '就绪',
    readyToPlay: '准备开始',
    recent: '最近玩过',
    resume: '继续',
    search: '搜索游戏库',
    sessionReady: '准备就绪',
    settings: '设置',
    statusPaused: '已暂停',
    statusRunning: '游戏运行中',
    statusStarting: '正在启动',
    stop: '退出游戏',
    tryAgain: '重试',
    volume: '音量',
  },
};

export const OFFICIAL_CATALOGS = { 'en-US': en, 'pt-BR': pt, 'zh-CN': zh } as const;
const persistedLocale =
  typeof window === 'undefined'
    ? undefined
    : (window.localStorage.getItem('pixelcore.locale') ?? undefined);

void i18n.use(initReactI18next).init({
  fallbackLng: 'en-US',
  interpolation: { escapeValue: true },
  lng: resolveLocale(
    persistedLocale,
    typeof navigator === 'undefined' ? 'en-US' : navigator.language,
  ),
  resources: OFFICIAL_CATALOGS,
});

export const setLocale = async (locale: SupportedLocale): Promise<void> => {
  if (typeof window !== 'undefined') window.localStorage.setItem('pixelcore.locale', locale);
  await i18n.changeLanguage(locale);
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
};

export default i18n;
