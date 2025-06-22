// Carousel functionality
const carouselTrack = document.querySelector(".carousel-track");
const albumCards = document.querySelectorAll(".album-card");
const prevButton = document.querySelector(".navigation-arrow.prev");
const nextButton = document.querySelector(".navigation-arrow.next");

let currentIndex = 2; // Start with middle card active
const cardWidth = window.innerWidth * 0.25; // 60% of viewport width for center card
const cardMargin = 20;
const totalCards = albumCards.length;

// Initialize carousel
function initCarousel() {
    // Set card widths and initial positions
    albumCards.forEach((card, index) => {
        const scale = index === currentIndex ? 1 : 0.8;
        const opacity = index === currentIndex ? 1 : 0.7;
        card.style.width = `${cardWidth}px`;
        card.style.transform = `scale(${scale})`;
        card.style.opacity = opacity;

        if (index === currentIndex) {
            card.classList.add("active");
            startProgressBar(card);
        }
    });

    updateCarouselPosition();
}

// Update carousel position based on current index
function updateCarouselPosition() {
    const offset = window.innerWidth / 2 - cardWidth / 2;
    const translateX = -(currentIndex * (cardWidth + cardMargin)) + offset;
    carouselTrack.style.transform = `translateX(${translateX}px)`;
}

// Start progress bar animation
function startProgressBar(card) {
    const progressBar = card.querySelector(".progress-bar");
    if (progressBar) {
        progressBar.style.width = "0";
        setTimeout(() => {
            progressBar.style.width = "100%";
            progressBar.style.transition = "width 20s linear";
        }, 300);
    }
}

// Event listeners for navigation buttons
prevButton.addEventListener("click", () => {
    if (currentIndex > 0) {
        moveToCard(currentIndex - 1);
    }
});

nextButton.addEventListener("click", () => {
    if (currentIndex < totalCards - 1) {
        moveToCard(currentIndex + 1);
    }
});

// Click on album card
albumCards.forEach((card, index) => {
    card.addEventListener("click", () => {
        if (index !== currentIndex) {
            moveToCard(index);
        }
    });
});

// Touch/swipe functionality
let touchStartX = 0;
let touchEndX = 0;

carouselTrack.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

carouselTrack.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    if (
        touchEndX < touchStartX - swipeThreshold &&
        currentIndex < totalCards - 1
    ) {
        // Swipe left -> next
        moveToCard(currentIndex + 1);
    } else if (touchEndX > touchStartX + swipeThreshold && currentIndex > 0) {
        // Swipe right -> prev
        moveToCard(currentIndex - 1);
    }
}

// Resize handling
window.addEventListener("resize", () => {
    initCarousel();
});

// Initialize carousel on load
window.addEventListener("load", initCarousel);

// Navigation between screens
document.getElementById("start-button").addEventListener("click", function () {
    // 停止所有可能正在播放的音樂
    albumCards.forEach((card) => {
        const audio = card.querySelector(".album-audio");
        if (audio && !audio.paused) {
            stopMusic(card);
        }
    });

    // 額外確保清除當前播放狀態
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    currentPlayingCard = null;

    document.getElementById("welcome-screen").classList.remove("active");
    document.getElementById("customize-screen").classList.add("active");
});

document
    .getElementById("back-to-welcome")
    .addEventListener("click", function () {
        document.getElementById("customize-screen").classList.remove("active");
        document.getElementById("welcome-screen").classList.add("active");
    });

// document
//     .getElementById("generate-button")
//     .addEventListener("click", function () {
//         document.getElementById("customize-screen").classList.remove("active");
//         document.getElementById("player-screen").classList.add("active");
//         animateProgressBar();
//     });

window.API_URL = "http://127.0.0.1:8000";

document
    .getElementById("generate-button")
    .addEventListener("click", async function () {
        // 確保載入畫面存在
        createLoadingScreen();

        // 停止當前播放的音樂
        if (currentPlayingCard) {
            stopMusic(currentPlayingCard);
        }

        // 收集用戶選擇
        const selectedOptions = {
            genre: getSelectedOption("genre-options"),
            instruments: getSelectedOption("instrument-options"),
            tempo: getSelectedOption("tempo-options"),
            length: getSelectedOption("length-options"),
        };

        // console.log("Selected options:", selectedOptions);

        // 檢查是否有選擇
        if (!selectedOptions.genre) {
            alert("請至少選擇一個音樂類型");
            return;
        }

        // 顯示載入動畫
        showLoadingScreen();

        try {
            // 調用後端 API
            updateLoadingStatus("連接 AI 服務中...");

            const response = await fetch(`${window.API_URL}/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(selectedOptions),
                // mode: 'cors', // 確保 CORS
            });

            updateLoadingStatus("接收生成的音樂...");

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || `生成失敗: ${response.status}`
                );
            }

            // 獲取生成的音頻
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            console.log("Audio generated successfully:", audioUrl);

            // 跳轉到播放器頁面
            document
                .getElementById("customize-screen")
                .classList.remove("active");
            document.getElementById("player-screen").classList.add("active");

            // 更新播放器
            updatePlayerWithGeneratedMusic(audioUrl, selectedOptions);
        } catch (error) {
            console.error("生成音樂失敗:", error);
            alert("生成音樂失敗：" + error.message);
        } finally {
            // 隱藏載入畫面
            hideLoadingScreen();
        }
    });

// 更新播放器以播放生成的音樂
function updatePlayerWithGeneratedMusic(audioUrl, params) {
    // 更新播放器資訊
    const playerScreen = document.getElementById("player-screen");
    const titleElement = playerScreen.querySelector("h1");
    const descElement = playerScreen.querySelector("p");

    if (titleElement) {
        titleElement.textContent = "Your AI Generated Track";
    }

    if (descElement) {
        const instruments = params.instruments.join(", ");
        descElement.textContent = `${params.genre} • ${instruments} • ${params.tempo} • ${params.mood}`;
    }

    // 創建音頻元素
    const audioElement = new Audio(audioUrl);

    // 設置播放控制
    const playButton = playerScreen.querySelector(".bg-white.rounded-full");
    const progressBar = document.getElementById("progress-bar");
    const currentTimeSpan = playerScreen.querySelector(
        ".text-sm.text-gray-400 span:first-child"
    );
    const totalTimeSpan = playerScreen.querySelector(
        ".text-sm.text-gray-400 span:last-child"
    );

    // 播放/暫停控制
    let isPlaying = false;

    playButton.addEventListener("click", () => {
        if (isPlaying) {
            audioElement.pause();
            playButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
        } else {
            audioElement.play();
            playButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
        }
        isPlaying = !isPlaying;
    });

    // 更新進度
    audioElement.addEventListener("timeupdate", () => {
        const progress =
            (audioElement.currentTime / audioElement.duration) * 100;
        progressBar.style.width = progress + "%";

        // 更新時間顯示
        currentTimeSpan.textContent = formatTime(audioElement.currentTime);
        totalTimeSpan.textContent = formatTime(audioElement.duration);
    });

    // 音頻載入完成
    audioElement.addEventListener("loadedmetadata", () => {
        totalTimeSpan.textContent = formatTime(audioElement.duration);
    });

    // 自動播放
    audioElement
        .play()
        .then(() => {
            isPlaying = true;
            playButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `;
        })
        .catch((e) => {
            console.log("自動播放失敗:", e);
        });
}

// 格式化時間
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// 輔助函數
function getSelectedOption(containerId) {
    const container = document.getElementById(containerId);
    const selected = container.querySelector(".option-item.selected");
    if (selected) {
        // 尋找不在圓形圖標內的 span
        const spans = selected.querySelectorAll("span");
        for (let span of spans) {
            // 檢查這個 span 是否在圖標容器內
            if (!span.closest(".rounded-full")) {
                return span.textContent.trim();
            }
        }
    }
    return null;
}

function updatePlayerWithGeneratedMusic(audioUrl, params) {
    // 創建新的 audio 元素
    const audioElement = new Audio(audioUrl);

    // 更新播放器資訊
    const playerScreen = document.getElementById("player-screen");
    playerScreen.querySelector("h1").textContent = "Your AI Generated Track";
    playerScreen.querySelector(
        "p"
    ).textContent = `${params.genre} • ${params.instruments} • ${params.tempo}`;

    // 設置播放控制
    setupGeneratedMusicPlayer(audioElement);
}

function setupGeneratedMusicPlayer(audioElement) {
    const playerScreen = document.getElementById("player-screen");

    // 取得播放器控制元素
    const playButton = playerScreen.querySelector(".bg-white.rounded-full");
    const prevButton = playerScreen.querySelector(
        'button:has(svg path[d*="M12.066"])'
    );
    const nextButton = playerScreen.querySelector(
        'button:has(svg path[d*="M11.933"])'
    );
    const progressBar = document.getElementById("progress-bar");
    const progressContainer = playerScreen.querySelector(
        ".h-1.w-full.bg-gray-700"
    );
    const currentTimeSpan = playerScreen.querySelector(
        ".text-sm.text-gray-400 span:first-child"
    );
    const totalTimeSpan = playerScreen.querySelector(
        ".text-sm.text-gray-400 span:last-child"
    );

    let isPlaying = false;
    let progressUpdateInterval = null;

    // 播放/暫停按鈕事件
    const handlePlayPause = () => {
        if (isPlaying) {
            audioElement.pause();
            updatePlayButton(false);
        } else {
            audioElement
                .play()
                .then(() => {
                    updatePlayButton(true);
                })
                .catch((error) => {
                    console.error("播放失敗:", error);
                    alert("無法播放音樂");
                });
        }
    };

    // 更新播放按鈕圖標
    const updatePlayButton = (playing) => {
        isPlaying = playing;
        if (playing) {
            playButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
        } else {
            playButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
        }
    };

    // 移除舊的事件監聽器（避免重複綁定）
    const newPlayButton = playButton.cloneNode(true);
    playButton.parentNode.replaceChild(newPlayButton, playButton);

    // 綁定新的播放按鈕事件
    newPlayButton.addEventListener("click", handlePlayPause);

    // 上一首/下一首按鈕（生成的音樂暫時禁用）
    if (prevButton) {
        prevButton.style.opacity = "0.3";
        prevButton.style.cursor = "not-allowed";
        prevButton.onclick = null;
    }

    if (nextButton) {
        nextButton.style.opacity = "0.3";
        nextButton.style.cursor = "not-allowed";
        nextButton.onclick = null;
    }

    // 進度條點擊事件
    if (progressContainer) {
        progressContainer.addEventListener("click", (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            const newTime = (percentage / 100) * audioElement.duration;

            if (!isNaN(newTime)) {
                audioElement.currentTime = newTime;
            }
        });
    }

    // 音頻事件監聽器
    audioElement.addEventListener("play", () => {
        updatePlayButton(true);
        startProgressUpdate();
    });

    audioElement.addEventListener("pause", () => {
        updatePlayButton(false);
        stopProgressUpdate();
    });

    audioElement.addEventListener("ended", () => {
        updatePlayButton(false);
        stopProgressUpdate();
        progressBar.style.width = "0%";
        currentTimeSpan.textContent = "0:00";
    });

    audioElement.addEventListener("loadedmetadata", () => {
        totalTimeSpan.textContent = formatTime(audioElement.duration);
    });

    audioElement.addEventListener("timeupdate", () => {
        updateProgressDisplay();
    });

    // 錯誤處理
    audioElement.addEventListener("error", (e) => {
        console.error("音頻錯誤:", e);
        updatePlayButton(false);
        stopProgressUpdate();

        let errorMessage = "無法播放音樂。";
        if (audioElement.error) {
            switch (audioElement.error.code) {
                case 1:
                    errorMessage += "載入被中止。";
                    break;
                case 2:
                    errorMessage += "網路錯誤。";
                    break;
                case 3:
                    errorMessage += "解碼錯誤。";
                    break;
                case 4:
                    errorMessage += "不支援的音頻格式。";
                    break;
            }
        }
        alert(errorMessage);
    });

    // 更新進度顯示
    function updateProgressDisplay() {
        if (!isNaN(audioElement.duration)) {
            const progress =
                (audioElement.currentTime / audioElement.duration) * 100;
            progressBar.style.width = progress + "%";
            currentTimeSpan.textContent = formatTime(audioElement.currentTime);
        }
    }

    // 開始進度更新
    function startProgressUpdate() {
        if (progressUpdateInterval) {
            clearInterval(progressUpdateInterval);
        }
        progressUpdateInterval = setInterval(updateProgressDisplay, 100);
    }

    // 停止進度更新
    function stopProgressUpdate() {
        if (progressUpdateInterval) {
            clearInterval(progressUpdateInterval);
            progressUpdateInterval = null;
        }
    }

    // 下載按鈕處理（如果需要）
    const downloadMenuItems = document.querySelectorAll(
        "#download-menu button"
    );
    downloadMenuItems.forEach((item) => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);

        newItem.addEventListener("click", () => {
            const format = newItem.textContent
                .trim()
                .split(" ")[0]
                .toLowerCase();
            downloadGeneratedMusic(audioElement.src, format);
        });
    });
}

// 下載生成的音樂
function downloadGeneratedMusic(audioUrl, format) {
    // 創建下載連結
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `ai_generated_music_${Date.now()}.${format}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 格式化時間輔助函數
function formatTime(seconds) {
    if (isNaN(seconds) || seconds === null || seconds === undefined) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// 顯示載入畫面
function showLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
        loadingScreen.style.display = "flex";

        // 更新載入狀態文字（可選）
        updateLoadingStatus("正在連接 AI 服務...");

        // 模擬進度更新
        setTimeout(() => updateLoadingStatus("分析您的音樂偏好..."), 1000);
        setTimeout(() => updateLoadingStatus("AI 正在創作旋律..."), 3000);
        setTimeout(() => updateLoadingStatus("添加樂器編排..."), 5000);
        setTimeout(() => updateLoadingStatus("最後調整中..."), 7000);
    }
}

// 隱藏載入畫面
function hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }
}

// 更新載入狀態文字
function updateLoadingStatus(text) {
    const statusElement = document.querySelector(".loading-status");
    if (statusElement) {
        statusElement.textContent = text;
    }
}

// 如果還沒有載入畫面元素，動態創建
function createLoadingScreen() {
    // 檢查是否已存在
    if (document.getElementById("loading-screen")) return;

    const loadingScreen = document.createElement("div");
    loadingScreen.id = "loading-screen";
    loadingScreen.className = "loading-screen";
    loadingScreen.style.display = "none";

    loadingScreen.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <h2 style="color: white; margin: 20px 0 10px 0;">AI 正在創作您的音樂</h2>
            <p class="loading-status" style="color: #a0a0a0;">準備中...</p>
            <div class="loading-progress" style="margin-top: 20px;">
                <div class="progress-bar-container" style="width: 200px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px;">
                    <div class="progress-bar-fill" style="height: 100%; background: #4f46e5; width: 0%; transition: width 0.3s ease; border-radius: 2px;"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(loadingScreen);
}

// 更新進度條（可選）
function updateLoadingProgress(percentage) {
    const progressFill = document.querySelector(".progress-bar-fill");
    if (progressFill) {
        progressFill.style.width = percentage + "%";
    }
}

document
    .getElementById("back-to-customize")
    .addEventListener("click", function () {
        document.getElementById("player-screen").classList.remove("active");
        document.getElementById("customize-screen").classList.add("active");
    });

// Category selection
const categoryItems = document.querySelectorAll(".category-item");
const optionsContainers = document.querySelectorAll(".options-container");

categoryItems.forEach((item) => {
    item.addEventListener("click", function () {
        // Update active category
        categoryItems.forEach((cat) => cat.classList.remove("active"));
        this.classList.add("active");

        // Show corresponding options
        const category = this.dataset.category;
        optionsContainers.forEach((container) =>
            container.classList.remove("active")
        );
        optionsContainers.forEach((container) =>
            container.classList.add("hidden")
        );
        document
            .getElementById(`${category}-options`)
            .classList.remove("hidden");
        document.getElementById(`${category}-options`).classList.add("active");
    });
});

// Option selection
const optionItems = document.querySelectorAll(".option-item");
optionItems.forEach((item) => {
    item.addEventListener("click", function () {
        // Toggle selection within its container
        const container = this.closest(".options-container");

        container
            .querySelectorAll(".option-item")
            .forEach((opt) => opt.classList.remove("selected"));
        this.classList.add("selected");
    });
});

// Download menu toggle
const downloadButton = document.getElementById("download-button");
const downloadMenu = document.getElementById("download-menu");

downloadButton.addEventListener("click", function () {
    downloadMenu.classList.toggle("active");
});

// Close download menu when clicking elsewhere
document.addEventListener("click", function (event) {
    if (
        !downloadButton.contains(event.target) &&
        !downloadMenu.contains(event.target)
    ) {
        downloadMenu.classList.remove("active");
    }
});

// Progress bar animation for player screen
function animateProgressBar() {
    const progressBar = document.getElementById("progress-bar");
    let width = 0;
    const interval = setInterval(function () {
        if (width >= 100) {
            clearInterval(interval);
        } else {
            width += 0.1;
            progressBar.style.width = width + "%";
        }
    }, 100);
}

// 音樂播放控制
let currentAudio = null;
let currentPlayingCard = null;
let progressInterval = null;

// 初始化音樂播放功能
function initMusicPlayer() {
    albumCards.forEach((card, index) => {
        const audio = card.querySelector(".album-audio");
        const albumImage = card.querySelector(".album-image");

        // 創建播放/暫停按鈕
        const playPauseBtn = document.createElement("div");
        playPauseBtn.className = "play-pause-icon";
        playPauseBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white play-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white pause-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="display: none;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `;

        // 移除原有的 play-indicator
        const oldIndicator = card.querySelector(".play-indicator");
        if (oldIndicator) oldIndicator.remove();

        // 添加新的播放/暫停按鈕
        albumImage.appendChild(playPauseBtn);

        // 點擊播放/暫停
        playPauseBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            togglePlay(card, audio);
        });

        // 音樂載入完成事件
        audio.addEventListener("loadedmetadata", () => {
            console.log(`音樂載入完成: ${card.dataset.title}`);
        });

        // 音樂結束事件
        audio.addEventListener("ended", () => {
            stopMusic(card);
            // 自動播放下一首
            if (currentIndex < totalCards - 1) {
                moveToCard(currentIndex + 1);
                setTimeout(() => {
                    const nextCard = albumCards[currentIndex];
                    const nextAudio = nextCard.querySelector(".album-audio");
                    togglePlay(nextCard, nextAudio);
                }, 500);
            }
        });

        // 錯誤處理
        audio.addEventListener("error", (e) => {
            console.error("音樂載入錯誤:", e);
            alert(
                "無法載入音樂檔案。請確認檔案路徑正確且瀏覽器支援 .au 格式。"
            );
        });
    });
}

function setupMusicInteraction() {
    // 只在歡迎頁面的特定元素上添加點擊監聽
    const welcomeScreen = document.getElementById("welcome-screen");

    // 點擊 album cards 播放音樂
    albumCards.forEach((card) => {
        card.addEventListener("click", function (e) {
            // 確保是在歡迎頁面且點擊的是卡片本身（不是播放按鈕）
            if (
                welcomeScreen.classList.contains("active") &&
                !e.target.closest(".play-pause-icon")
            ) {
                if (!userInteracted) {
                    userInteracted = true;
                }
                // 如果點擊的是當前活動卡片，開始播放
                if (card.classList.contains("active") && !currentPlayingCard) {
                    const audio = card.querySelector(".album-audio");
                    if (audio && audio.paused) {
                        playMusic(card, audio);
                    }
                }
            }
        });
    });

    // 左右箭頭也可以觸發首次互動
    [prevButton, nextButton].forEach((button) => {
        button.addEventListener("click", () => {
            if (!userInteracted && welcomeScreen.classList.contains("active")) {
                userInteracted = true;
            }
        });
    });
}

// 在 window load 事件中調用
window.addEventListener("load", () => {
    initCarousel();
    initMusicPlayer();
    setupMusicInteraction(); // 添加這行
});

// 播放/暫停切換
function togglePlay(card, audio) {
    if (currentAudio && currentAudio !== audio) {
        // 停止其他正在播放的音樂
        stopMusic(currentPlayingCard);
    }

    if (audio.paused) {
        playMusic(card, audio);
    } else {
        pauseMusic(card, audio);
    }
}

// 暫停音樂
function pauseMusic(card, audio) {
    audio.pause();
    card.classList.remove("playing");

    // 更新圖標
    const playIcon = card.querySelector(".play-icon");
    const pauseIcon = card.querySelector(".pause-icon");
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";

    // 停止進度更新
    if (progressInterval) {
        clearInterval(progressInterval);
    }
}

// 停止音樂
function stopMusic(card) {
    if (!card) return;

    const audio = card.querySelector(".album-audio");
    audio.pause();
    audio.currentTime = 0;
    card.classList.remove("playing");

    // 更新圖標
    const playIcon = card.querySelector(".play-icon");
    const pauseIcon = card.querySelector(".pause-icon");
    if (playIcon && pauseIcon) {
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
    }

    // 重置進度條
    const progressBar = card.querySelector(".progress-bar");
    if (progressBar) {
        progressBar.style.width = "0";
        progressBar.style.transition = "none";
    }

    // 停止進度更新
    if (progressInterval) {
        clearInterval(progressInterval);
    }

    if (currentPlayingCard === card) {
        currentAudio = null;
        currentPlayingCard = null;
    }
}

// 更新進度條
function updateProgress(card, audio) {
    const progressBar = card.querySelector(".progress-bar");

    // 立即更新一次
    const updateProgressBar = () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = progress + "%";
        progressBar.style.transition = "width 0.1s linear";
    };

    // 清除舊的 interval
    if (progressInterval) {
        clearInterval(progressInterval);
    }

    // 每 100ms 更新一次進度
    progressInterval = setInterval(updateProgressBar, 100);
}

// 修改原有的 moveToCard 函數
const originalMoveToCard = moveToCard;
function moveToCard(index) {
    // 停止當前播放的音樂
    if (currentPlayingCard) {
        stopMusic(currentPlayingCard);
    }

    // 移除所有卡片的 active 類別
    albumCards.forEach((card) => {
        card.classList.remove("active");
        card.style.transform = "scale(0.7)";
        card.style.opacity = "0.7";

        // 重置進度條
        const progressBar = card.querySelector(".progress-bar");
        if (progressBar) progressBar.style.width = "0";
    });

    // 設置新的活動卡片
    currentIndex = index;
    const activeCard = albumCards[currentIndex];
    activeCard.classList.add("active");
    activeCard.style.transform = "scale(1)";
    activeCard.style.opacity = "1";

    // 更新 carousel 位置
    updateCarouselPosition();

    // 自動播放新的活動卡片
    const audio = activeCard.querySelector(".album-audio");
    if (audio) {
        // 延遲一點播放，確保動畫順暢
        setTimeout(() => {
            playMusic(activeCard, audio);
        }, 300);
    }
}

// 添加用戶互動檢測
let userInteracted = false;

// // 監聽任何用戶互動
// document.addEventListener("click", (e) => {
//     // 檢查點擊的是否是導航按鈕
//     const isNavigationButton =
//         e.target.id === "start-button" ||
//         e.target.closest("#start-button") ||
//         e.target.id === "back-to-welcome" ||
//         e.target.closest("#back-to-welcome") ||
//         e.target.id === "generate-button" ||
//         e.target.closest("#generate-button") ||
//         e.target.id === "back-to-customize" ||
//         e.target.closest("#back-to-customize");

//     // 如果是導航按鈕，不要開始播放音樂
//     if (isNavigationButton) {
//         return;
//     }

//     if (!userInteracted) {
//         userInteracted = true;
//         // 如果有活動卡片且尚未播放，開始播放
//         const activeCard = document.querySelector(".album-card.active");
//         if (activeCard && !currentPlayingCard) {
//             const audio = activeCard.querySelector(".album-audio");
//             if (audio && audio.paused) {
//                 playMusic(activeCard, audio);
//             }
//         }
//     }
// });

// 修改 playMusic 函數以處理自動播放失敗
function playMusic(card, audio) {
    audio
        .play()
        .then(() => {
            card.classList.add("playing");
            currentAudio = audio;
            currentPlayingCard = card;

            // 更新圖標
            const playIcon = card.querySelector(".play-icon");
            const pauseIcon = card.querySelector(".pause-icon");
            if (playIcon && pauseIcon) {
                playIcon.style.display = "none";
                pauseIcon.style.display = "block";
            }

            // 更新進度條
            updateProgress(card, audio);

            // 如果不是當前活動的卡片，切換到該卡片
            const cardIndex = parseInt(card.dataset.index);
            if (cardIndex !== currentIndex) {
                moveToCard(cardIndex);
            }
        })
        .catch((error) => {
            console.error("自動播放失敗:", error);
            // 如果是自動播放策略導致的失敗，顯示提示
            if (error.name === "NotAllowedError") {
                // 可以選擇顯示一個提示，告訴用戶點擊頁面任意位置開始播放
                console.log("請點擊頁面任意位置開始播放音樂");
            }
        });
}

// 在頁面載入完成後初始化音樂播放器
window.addEventListener("load", () => {
    initCarousel();
    initMusicPlayer(); // 添加這行
});
