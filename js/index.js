import { pitchToIndex, pitchOrder } from "./utils.js";

// 類似曲検索
function getSimilarRangeSongs(
  targetSong,
  allSongs,
  lowerOffset = 0,
  upperOffset = 0
) {
  const baseLow = pitchToIndex(targetSong.keyLow);
  const baseHigh = pitchToIndex(targetSong.keyHigh);

  const adjustedLow = Math.max(0, baseLow + lowerOffset);
  const adjustedHigh = Math.min(pitchOrder.length - 1, baseHigh + upperOffset);

  return allSongs.filter((song) => {
    const songLow = pitchToIndex(song.keyLow);
    const songHigh = pitchToIndex(song.keyHigh);

    return (
      songLow !== -1 &&
      songHigh !== -1 &&
      songLow >= adjustedLow &&
      songHigh <= adjustedHigh &&
      song.title !== targetSong.title
    );
  });
}

// レンジスライダーの描画
const activeColor = "#4ec6ff";
const inactiveColor = "#f5f5f5";

function updateSliderBackground(slider) {
  const value = slider.value;
  const min = slider.min ? slider.min : 0;
  const max = slider.max ? slider.max : 100;
  const ratio = ((value - min) / (max - min)) * 100;

  $(slider).css(
    "background",
    `linear-gradient(90deg, ${activeColor} ${ratio}%, ${inactiveColor} ${ratio}%)`
  );

  // ラベルを再描画
  const id = $(slider).attr("id");
  $("#" + id + "Value").text(value);
}

// 検索結果描画
function renderResults(songs) {
  // 非表示を表示に変更
  $("#resultSection").show();

  const $list = $("#resultList");
  $list.empty();

  if (songs.length === 0) {
    $list.append(
      "<li class='result-item'>該当する曲が見つかりませんでした</li>"
    );
    $("#copyResultsBtn").hide();
    return;
  }

  songs.forEach((song) => {
    const $item = $("<li>").addClass("result-item");

    // 表示領域の概要
    /*
     * ---------------------------------------------------
     * タイトル
     * アーティスト  アイコン(youtube等)   キー（音階）
     * ---------------------------------------------------
     */

    // 左側：曲名・アーティスト名
    const $info = $("<div>").addClass("result-info");
    const $title = $("<span>").addClass("result-title").text(song.title);
    const $artist = $("<span>").addClass("result-artist").text(song.artist);

    $info.append($title).append($artist);

    // 中央：リンク（固定幅領域）
    const $links = $("<div>").addClass("result-links");

    if (song.youtube) {
      const $yt = $("<a>")
        .attr("href", song.youtube)
        .attr("target", "_blank")
        .html(
          '<i class="fa-brands fa-youtube" style="color:#ff6083; font-size:18px;"></i>'
        )
        .css("text-decoration", "none");
      $links.append($yt);
    }

    if (song.spotify) {
      const $sp = $("<a>")
        .attr("href", song.spotify)
        .attr("target", "_blank")
        .html(
          '<i class="fab fa-spotify" style="color:#1DB954; font-size:18px; "></i>'
        )
        .css("text-decoration", "none");
      $links.append($sp);
    }

    // // 右側：キーやリンク
    // const $key = $("<div>")
    //   .addClass("result-key")
    //   .text(`${song.keyLow}〜${song.keyHigh}`);

    // 順番に追加
    $item.append($info).append($links); //.append($key);
    $list.append($item);
  });
}

// 曲名絞り込み
function populateSongSelect(songs) {
  const $select = $("#songSelect");
  // 初期化
  $select.empty();

  // placeholder 用の空option
  $select.append($("<option>").val("").text(""));

  // option追加
  songs.forEach((song) => {
    $select.append(
      $("<option>").val(song.title).text(`${song.title}（${song.artist}）`)
    );
  });
  $select.trigger("change"); // select2再描画
}

// 初期処理
$(function () {
  let allSongs = [];
  let artists = [];
  let titles = [];

  const $artistSelect = $("#artistSelect");
  const $songSelect = $("#songSelect");

  // レンジスライダー
  const $maxAdjust = $("#maxAdjust");
  const $minAdjust = $("#minAdjust");

  $.getJSON("./data/songs.json", function (data) {
    allSongs = data;

    // アーティスト一覧(重複除外)
    artists = Array.from(new Set(allSongs.map((song) => song.artist)));

    titles = allSongs.map((song) => ({
      label: `${song.title}（${song.artist}）`, // 表示される内容
      value: song.title, // 実際に入力欄に入るのは曲名だけ
    }));

    const $artistSelect = $("#artistSelect");
    const $songSelect = $("#songSelect");

    // レンジスライダー
    const $maxAdjust = $("#maxAdjust");
    const $minAdjust = $("#minAdjust");

    // 初期にすべて追加
    $artistSelect.append($("<option>").text("すべて").val(""));

    // アーティストのオプション追加
    for (const artist of artists) {
      $artistSelect.append($("<option>").html(artist).val(artist));
    }

    // アーティスト名絞り込み初期化
    $artistSelect.select2({
      // placeholderを設定すると初期選択を指定できない。
      width: "resolve",
    });

    // 初期値を「すべて」にしてUIも更新
    $artistSelect.val("").trigger("change");

    // 曲名絞り込み初期化
    $songSelect.select2({
      placeholder: "曲名を入力・選択",
      width: "resolve",
    });

    // 初期状態：全曲表示
    populateSongSelect(allSongs);

    // アーティスト選択で絞り込み
    $artistSelect.on("change", function () {
      const selectedArtist = $(this).val();
      if (!selectedArtist) {
        populateSongSelect(allSongs); // 「すべて」の場合は全曲
      } else {
        const filtered = allSongs.filter((s) => s.artist === selectedArtist);
        populateSongSelect(filtered);
      }
    });
  });

  // 楽曲変更
  $("#songSelect").on("change", function () {
    // 楽曲変更時に補正値をリセットする
    $("#maxAdjust").val(0).trigger("input");
    $("#minAdjust").val(0).trigger("input");
  });

  // アコーディオンメニュー
  $(".accordion-header").on("click", function () {
    const content = $(this).next(".accordion-content");
    content.toggleClass("open");

    // ▼ / ▲ 切り替え
    if (content.hasClass("open")) {
      $(this).text("詳細条件 ▲");
    } else {
      $(this).text("詳細条件 ▼");
    }
  });

  // イベント登録
  $("#maxAdjust, #minAdjust").on("input", function () {
    updateSliderBackground(this);
  });

  // 初期描画時に同期
  $("#maxAdjust, #minAdjust").each(function () {
    updateSliderBackground(this);
  });

  // ＋－ボタン操作時
  $(".step-btn").on("click", function () {
    let target = $(this).data("target");
    let diff = parseInt($(this).data("diff"));
    let $slider = $("#" + target);

    let min = parseInt($slider.attr("min"));
    let max = parseInt($slider.attr("max"));
    let current = parseInt($slider.val());

    let newValue = Math.min(Math.max(current + diff, min), max);
    $slider.val(newValue);
    $slider.trigger("input");
  });

  // 検索実行
  $(".searchButton").on("click", function () {
    const selectedTitle = $("#songSelect").val();
    if (!selectedTitle) return;

    const targetSong = allSongs.find((song) => song.title === selectedTitle);
    if (!targetSong) {
      renderResults([]);
      return;
    }

    const lowerOffset = parseInt($("#minAdjust").val(), 10) || 0;
    const upperOffset = parseInt($("#maxAdjust").val(), 10) || 0;

    const results = getSimilarRangeSongs(
      targetSong,
      allSongs,
      lowerOffset,
      upperOffset
    );
    renderResults(results);
  });

  // 結果コピーボタン
  $("#copyResultsBtn").on("click", function () {
    const resultsText = $("#resultList")
      .map(function () {
        return $(this).text();
      })
      .get()
      .join("\n");

    if (!$.trim(resultsText)) {
      alert("コピーする検索結果がありません。");
      return;
    }

    // navigator.clipboard が使える場合（Android Chrome, PC Chromeなど）
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(resultsText)
        .then(function () {
          alert("コピーしました！メモ帳などに貼り付けてください。");
        })
        .catch(function () {
          fallbackCopy(resultsText);
        });
    } else {
      // iOS Safariや古いブラウザ用フォールバック
      fallbackCopy(resultsText);
    }
  });

  // iOS Safari など古い環境も考慮した古い版の処理
  function fallbackCopy(text) {
    const textarea = $("<textarea>")
      .val(text)
      .css({
        position: "fixed",
        left: "-9999px",
      })
      .appendTo("body");

    textarea[0].select();

    try {
      document.execCommand("copy");
      alert("コピーしました！メモ帳などに貼り付けてください。");
    } catch (err) {
      alert("コピーできませんでした。手動で選択してください。");
    }

    textarea.remove();
  }

  // jQueryでモーダル制御
  $("#helpBtn").on("click", function () {
    $("#helpModal").fadeIn();
  });
  $("#closeModal, #helpModal").on("click", function (e) {
    console.log("モーダル閉じる", e);
    if (e.target.id === "helpModal" || e.target.id === "closeModal") {
      $("#helpModal").fadeOut();
    }
  });
});
