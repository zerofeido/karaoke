// 音程の順序定義(上から0)
const pitchOrder = [
  "lowC",
  "lowC#",
  "lowD",
  "lowD#",
  "lowE",
  "lowF",
  "lowF#",
  "lowG",
  "lowG#",
  "lowA",
  "lowA#",
  "lowB",
  "mid1C",
  "mid1C#",
  "mid1D",
  "mid1D#",
  "mid1E",
  "mid1F",
  "mid1F#",
  "mid1G",
  "mid1G#",
  "mid1A",
  "mid1A#",
  "mid1B",
  "mid2C",
  "mid2C#",
  "mid2D",
  "mid2D#",
  "mid2E",
  "mid2F",
  "mid2F#",
  "mid2G",
  "mid2G#",
  "mid2A",
  "mid2A#",
  "mid2B",
  "hiC",
  "hiC#",
  "hiD",
  "hiD#",
  "hiE",
  "hiF",
  "hiF#",
  "hiG",
  "hiG#",
  "hiA",
  "hiA#",
  "hiB",
  "hihiC",
  "hihiC#",
  "hihiD",
  "hihiD#",
  "hihiE",
  "hihiF",
  "hihiF#",
  "hihiG",
  "hihiG#",
  "hihiA",
  "hihiA#",
  "hihiB",
];

// 音域の数値変換関数
function pitchToIndex(pitch) {
  return pitchOrder.indexOf(pitch);
}

// ボトムナビ(モード切替)
function changeMode() {
  $(function () {
    // ページ読み込み時にモードを復元
    const savedMode = localStorage.getItem("mode");
    if (savedMode === "light") {
      $("body").addClass("light-mode");
      $("#modeSwitch").prop("checked", true);
    } else {
      $("body").removeClass("light-mode");
      $("#modeSwitch").prop("checked", false);
    }

    // モード切替イベント
    $("#modeSwitch").on("change", function () {
      if ($(this).is(":checked")) {
        $("body").addClass("light-mode");
        localStorage.setItem("mode", "light");
      } else {
        $("body").removeClass("light-mode");
        localStorage.setItem("mode", "dark");
      }
    });
  });
}

// ボトムナビ(ページ切替)
function initBottomNav() {
  $(document).ready(function () {
    let currentPage = window.location.pathname.split("/").pop();
    console.log("currentPage", currentPage);

    // 拡張子がある場合は削除
    currentPage = currentPage.replace(/\.html$/, "");

    // ルート（空文字）の場合は index とする
    if (!currentPage) currentPage = "index";

    $(".nav-item").each(function () {
      if ($(this).data("href") === currentPage) {
        $(this).addClass("active");
      }
    });

    // クリック
    $(".nav-item").on("click", function () {
      const href = $(this).data("href");
      if (href && href !== currentPage) {
        // ページ切替
        window.location.href = href + ".html";
      }
    });
  });
}

export { pitchOrder, pitchToIndex, initBottomNav, changeMode };
