import { pitchToIndex } from "./utils.js";

// 曲名絞り込み
function populateSongSelect(songs, $target) {
  // 初期化
  $target.empty();

  // placeholder 用の空option
  $target.append($("<option>").val("").text(""));

  // option追加
  songs.forEach((song) => {
    $target.append(
      $("<option>").val(song.title).text(`${song.title}（${song.artist}）`)
    );
  });
  $target.trigger("change");
}

// 初期処理
$(function () {
  let allSongs = [];
  let artists = [];
  let titles = [];

  // JSON取得
  $.getJSON("./data/songs.json", function (data) {
    allSongs = data;

    // アーティスト一覧(重複除外)
    artists = Array.from(new Set(allSongs.map((song) => song.artist)));

    titles = allSongs.map((song) => ({
      label: `${song.title}（${song.artist}）`, // 表示される内容
      value: song.title, // 実際に入力欄に入るのは曲名だけ
    }));

    // 定数
    const $targetArtist = $("#targetArtist");
    const $targetSong = $("#targetSong");
    const $referenceArtist = $("#referenceArtist");
    const $referenceSong = $("#referenceSong");

    // 初期値にすべて追加
    $targetArtist.append($("<option>").text("すべて").val(""));
    $referenceArtist.append($("<option>").text("すべて").val(""));

    // アーティストのオプション追加
    for (const artist of artists) {
      $targetArtist.append($("<option>").html(artist).val(artist));
      $referenceArtist.append($("<option>").html(artist).val(artist));
    }

    // アーティスト名絞り込み初期化
    $targetArtist.select2({
      // placeholderを設定すると初期選択を指定できない。
      width: "resolve",
    });
    $referenceArtist.select2({
      // placeholderを設定すると初期選択を指定できない。
      width: "resolve",
    });

    // 曲名絞り込み初期化
    $targetSong.select2({
      placeholder: "曲名を入力・選択",
      width: "resolve",
    });
    $referenceSong.select2({
      placeholder: "曲名を入力・選択",
      width: "resolve",
    });

    // 初期値を「すべて」にしてUIも更新
    $targetArtist.val("").trigger("change");
    $referenceArtist.val("").trigger("change");

    // 初期状態：全曲表示
    populateSongSelect(allSongs, $targetSong);
    populateSongSelect(allSongs, $referenceSong);

    // アーティスト選択で絞り込み
    $targetArtist.on("change", function () {
      const selectedArtist = $(this).val();
      if (!selectedArtist) {
        populateSongSelect(allSongs, $targetSong); // 「すべて」の場合は全曲
      } else {
        const filtered = allSongs.filter((s) => s.artist === selectedArtist);
        populateSongSelect(filtered, $targetSong);
      }
    });
    $referenceArtist.on("change", function () {
      const selectedArtist = $(this).val();
      if (!selectedArtist) {
        populateSongSelect(allSongs, $referenceSong); // 「すべて」の場合は全曲
      } else {
        const filtered = allSongs.filter((s) => s.artist === selectedArtist);
        populateSongSelect(filtered, $referenceSong);
      }
    });

    // オートコンプリートを初期化
    $("#targetSong, #referenceSong").autocomplete({
      source: titles, // 上の配列
      minLength: 1,
    });
  });

  // アコーディオンメニュー
  $(".accordion-header").on("click", function () {
    const content = $(this).next(".accordion-content");
    content.toggleClass("open");

    // ▼ / ▲ 切り替え
    if (content.hasClass("open")) {
      $(this).text("アーティスト名で絞り込み ▲");
    } else {
      $(this).text("アーティスト名で絞り込み ▼");
    }
  });

  // 検索
  $("#checkButton").on("click", function () {
    const targetTitle = $("#targetSong").val();
    const referenceTitle = $("#referenceSong").val();

    console.log("targetTitle", targetTitle);
    console.log("referenceTitle", referenceTitle);

    const target = allSongs.find((song) => song.title === targetTitle);
    const reference = allSongs.find((song) => song.title === referenceTitle);

    if (!target || !reference) {
      $("#recommendationText").text("曲が見つかりませんでした");
      return;
    }

    const lowDiff =
      pitchToIndex(target.keyLow) - pitchToIndex(reference.keyLow);
    const highDiff =
      pitchToIndex(target.keyHight) - pitchToIndex(reference.keyHight);
    const avgDiff = Math.round((lowDiff + highDiff) / 2);

    const sign = avgDiff > 0 ? "+" : "";
    $("#recommendationText").text(`おすすめのキー変更： ${sign}${avgDiff}`);

    // 推奨結果セクションを表示
    $("#resultSection").show();
  });

  // キー調整のヒントの展開状態
  // ヒントを開くボタンをクリックしたとき
  $("#keyTips").on("click", function () {
    const $container = $(".container");

    if ($(this).hasClass("open")) {
      // 閉じる処理
      $container.css("margin-bottom", "");
      $(this).removeClass("open");
    } else {
      // 開く処理
      $container.css("margin-bottom", "333px");
      $(this).addClass("open");
    }
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
