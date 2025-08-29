// 曲名絞り込み
function populateSongSelect(songs, $target) {
  // 初期化
  $target.empty();

  // placeholder 用の空option
  $target.append($("<option>").val("").text(""));

  // option追加
  songs.forEach((song) => {
    $target.append(
      $("<option>")
        .val(`${song.title}（${song.artist}）`)
        .text(`${song.title}（${song.artist}）`)
    );
  });
  $target.trigger("change");
}

// 有効化の切り替え
function changeDisabled(monitoreTarget, disabledTarget) {
  const val = monitoreTarget.val();
  if (val !== "" && val !== null) {
    disabledTarget.prop("disabled", false);
  } else {
    disabledTarget.prop("disabled", true);
  }
}

// 初期処理
$(function () {
  let filteredSongs = [];
  let artists = [];
  let titles = [];

  // JSON取得
  $.getJSON("./data/songs.json", function (data) {
    // 歌い手情報がない曲は除外する
    filteredSongs = data.filter((item) => {
      return item.utaite && item.utaite.length > 0;
    });

    // アーティスト一覧(重複除外)
    artists = Array.from(new Set(filteredSongs.map((song) => song.artist)));

    titles = filteredSongs.map((song) => ({
      label: `${song.title}（${song.artist}）`, // 表示される内容
      value: song.title, // 実際に入力欄に入る値
    }));

    // 定数
    const $targetArtist = $("#targetArtist");
    const $targetSong = $("#targetSong");
    const $utaite = $("#utaite");

    // 初期値にすべて追加
    $targetArtist.append($("<option>").text("すべて").val(""));

    // アーティストのオプション追加
    for (const artist of artists) {
      $targetArtist.append($("<option>").html(artist).val(artist));
    }

    // アーティスト名絞り込み初期化
    $targetArtist.select2({
      // placeholderを設定すると初期選択を指定できない。
      width: "resolve",
    });

    // 曲名絞り込み初期化
    $targetSong.select2({
      placeholder: "曲名を入力・選択",
      width: "resolve",
    });
    $utaite.select2({
      placeholder: "歌い手を入力・選択",
      width: "resolve",
    });

    // 初期値を「すべて」にしてUIも更新
    $targetArtist.val("").trigger("change");

    // 初期状態：全曲表示
    populateSongSelect(filteredSongs, $targetSong);

    // アーティスト選択で絞り込み
    $targetArtist.on("change", function () {
      const selectedArtist = $(this).val();
      if (!selectedArtist) {
        populateSongSelect(filteredSongs, $targetSong); // 「すべて」の場合は全曲
      } else {
        const filtered = filteredSongs.filter(
          (s) => s.artist === selectedArtist
        );
        populateSongSelect(filtered, $targetSong);
      }

      // 歌い手の選択を初期化
      $utaite.val(null).trigger("change");
    });

    // 歌いたい曲選択
    $targetSong.on("change", function () {
      console.log("歌いたい曲変更");
      console.log("$utaite.val();", $(this).val());
      const selectedSong = $(this).val();
      if (!selectedSong) {
        // 未選択
        changeDisabled($targetSong, $utaite);
      } else {
        // 選択済み(楽曲名とアーティスト名が一致していることを確認)
        const filtered = filteredSongs.filter(
          (s) => `${s.title}（${s.artist}）` === selectedSong
        )[0];
        const $target = $utaite;

        // 初期化
        $target.empty();

        // placeholder 用の空option
        $target.append($("<option>").val("").text(""));

        // option追加
        filtered.utaite.forEach((utaite) => {
          $target.append($("<option>").val(utaite.name).text(`${utaite.name}`));
        });
        $target.trigger("change");
        changeDisabled($targetSong, $utaite);
      }

      // 歌い手の選択を初期化
      $utaite.val(null).trigger("change");
    });

    // オートコンプリートを初期化
    $("#targetSong, #utaite").autocomplete({
      source: titles, // 上の配列
      minLength: 1,
    });

    changeDisabled($targetSong, $utaite);
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
  $(".searchButton").on("click", function () {
    const targetTitle = $("#targetSong").val();
    const utaiteVal = $("#utaite").val();

    const target = filteredSongs.find(
      (song) => `${song.title}（${song.artist}）` === targetTitle
    );

    const utaiteInfo = target.utaite.find(
      (utaite) => utaite.name === utaiteVal
    );

    if (!target || !utaiteInfo) {
      $("#result").text("曲が見つかりませんでした");
      return;
    }

    // 色の決定
    let className = "neutralText"; // ±0
    if (utaiteInfo.key > 0) className = "plusText"; // プラス値
    if (utaiteInfo.key < 0) className = "minusText"; // マイナス値

    $("#result").html(
      `${utaiteInfo.name}さんの調整キー： <span id="resultText" class="${className}">${utaiteInfo.key}</span>`
    );

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

  // jQueryでモーダル制御
  $("#helpBtn").on("click", function () {
    $("#helpModal").fadeIn();
  });
  $("#closeModal, #helpModal").on("click", function (e) {
    if (e.target.id === "helpModal" || e.target.id === "closeModal") {
      $("#helpModal").fadeOut();
    }
  });
});
