import { pitchToIndex, pitchOrder } from "./utils.js";

// このキー範囲で検索
function getSongsByManualRange(low, high, allSongs) {
  const lowIdx = pitchToIndex(low);
  const highIdx = pitchToIndex(high);

  return allSongs.filter((song) => {
    const songLow = pitchToIndex(song.keyLow);
    const songHigh = pitchToIndex(song.keyHigh);
    return (
      songLow !== -1 &&
      songHigh !== -1 &&
      songLow >= lowIdx &&
      songHigh <= highIdx
    );
  });
}

// 検索結果表示
function renderResults(songs) {
  $("#resultHeader").show();
  const $list = $("#resultList");
  $list.empty();

  if (songs.length === 0) {
    $list.append("<li>該当する曲が見つかりませんでした</li>");
    return;
  }

  songs.forEach((song) => {
    const $item = $("<li>");
    const $title = $("<span>").text(
      `${song.title}（${song.artist}）－  ${song.keyLow}〜${song.keyHigh}`
    );

    if (song.youtube) {
      const $link = $("<a>")
        .attr("href", song.youtube)
        .attr("target", "_blank")
        .text(" ▶️")
        .css({ marginLeft: "6px", textDecoration: "none" });

      $item.append($title, $link);
    } else {
      $item.append($title);
    }

    $list.append($item);
  });
}

// 鍵盤のデータ（上→下）
const keys = [
  { name: "hihiA", type: "white" },
  { name: "hiG#", type: "black", parent: "hihiA" },
  { name: "hiG", type: "white" },
  { name: "hiF#", type: "black", parent: "hiG" },
  { name: "hiF", type: "white" },
  { name: "hiE", type: "white" },
  { name: "hiD#", type: "black", parent: "hiE" },
  { name: "hiD", type: "white" },
  { name: "hiC#", type: "black", parent: "hiD" },
  { name: "hiC", type: "white" },
  // 以下省略 — 実際は全部のキーを記載
];

// 状態管理
let selectingKeyType = null; // 'low' または 'high'
let lowKey = null;
let highKey = null;

// モーダル表示
function openKeyModal(type) {
  selectingKeyType = type; // 'low' or 'high'
  document.getElementById("keyModal").style.display = "block";
  document.getElementById("keyModalTitle").textContent =
    type === "low" ? "最低キーを選択" : "最高キーを選択";
}

// モーダル閉じる
function closeKeyModal() {
  document.getElementById("keyModal").style.display = "none";
}

// 選択範囲のハイライト
function highlightRange() {
  const allKeys = document.querySelectorAll(
    "#keyModal .white-key, #keyModal .black-key"
  );
  allKeys.forEach((k) => k.classList.remove("selected-key"));

  if (!lowKey || !highKey) return;

  let inRange = false;
  allKeys.forEach((k) => {
    if (k.dataset.key === lowKey) inRange = true;
    if (inRange) k.classList.add("selected-key");
    if (k.dataset.key === highKey) inRange = false;
  });
}

// 初期化処理
$(function () {
  let allSongs = [];
  let titles = [];

  // 鍵盤クリックで選択切り替え
  $(".key").on("click", function (e) {
    console.log("鍵盤クリック");
    e.stopPropagation();
    $(this).toggleClass("selected");
  });

  // キーセレクトの初期化
  pitchOrder.forEach((pitch) => {
    $("#manualLow, #manualHigh").append(
      `<option value="${pitch}">${pitch}</option>`
    );
  });

  // セレクトの初期選択は option を追加した「後」で行う！
  $("#manualLow").val("mid2B");
  $("#manualHigh").val("hiC");

  // pitchOrderに基づいてセレクトボックスを構築
  pitchOrder.forEach((pitch) => {
    $("#manualKeySelect").append(`<option value="${pitch}">${pitch}</option>`);
  });

  // JSON取得
  $.getJSON("./data/songs.json", function (data) {
    allSongs = data;
    titles = allSongs.map((song) => ({
      label: `${song.title}（${song.artist}）`, // 表示される内容
      value: song.title, // 実際に入力欄に入るのは曲名だけ
    }));

    // オートコンプリートを初期化
    $("#songInput").autocomplete({
      source: titles, // 上の配列
      minLength: 1,
    });
  });

  // このキー範囲で検索
  $("#manualSearchButton").on("click", function () {
    const low = $("#manualLow").val();
    const high = $("#manualHigh").val();

    const lowIdx = pitchToIndex(low);
    const highIdx = pitchToIndex(high);

    if (lowIdx === -1 || highIdx === -1 || lowIdx > highIdx) {
      alert("キーの範囲が正しくありません");
      return;
    }

    const results = getSongsByManualRange(low, high, allSongs);
    renderResults(results);
  });

  // ナビ固定
  $(".nav-item").on("click", function () {
    const targetSelector = $(this).data("target");

    // ボタンのactive切り替え
    $(".nav-item").removeClass("active");
    $(this).addClass("active");

    // セクションの表示切り替え
    $(".section").hide();
    $(targetSelector).show();
  });
});
