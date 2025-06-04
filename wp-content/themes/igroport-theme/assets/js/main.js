// assets/js/main.js
jQuery(document).ready(function($) {

    /**
     * Client-side Game Filtering Logic
     */
    const searchInput = $('#searchInput');

    if (searchInput.length) {
        // Новая логика фильтрации
        searchInput.on('input', function() {
            const searchTerm = $(this).val().toLowerCase().trim();
            
            $('.games-grid').each(function() {
                const gamesGrid = $(this);
                const gameCards = gamesGrid.find('.game-card');
                let visibleGames = 0;

                gameCards.each(function() {
                    const card = $(this);
                    const gameTitleElement = card.find('h3, h4'); 
                    const gameName = gameTitleElement.text().toLowerCase();

                    if (gameName.includes(searchTerm)) {
                        card.show();
                        visibleGames++;
                    } else {
                        card.hide();
                    }
                });

                gamesGrid.siblings('.no-results-filter-message').remove();

                if (visibleGames === 0 && searchTerm !== '') {
                    gamesGrid.after('<p class="no-results-filter-message" style="text-align:center; color: var(--text-color); padding: 20px 0;">No games found matching your search in this section.</p>');
                }
            });

            if (searchTerm === '') {
                $('.games-grid .game-card').show();
                $('.no-results-filter-message').remove();
            }
        });

        const searchForm = searchInput.closest('form');
        if (searchForm.length) {
            searchForm.on('submit', function(e) {
                e.preventDefault(); 
            });
        }
    }

    /**
     * Mobile Menu Toggle
     */
    const mobileMenuToggle = $('.mobile-menu-toggle');
    const primaryMenu = $('#primary-menu-ul'); // The <ul> element for the primary menu

    if (mobileMenuToggle.length && primaryMenu.length) {
        mobileMenuToggle.on('click', function() {
            $(this).toggleClass('active');
            primaryMenu.toggleClass('active'); // Toggle class on the menu ul
            
            // Optionally, toggle a class on the body if you need to prevent scrolling, etc.
            // $('body').toggleClass('mobile-menu-open');
            
            const isExpanded = $(this).attr('aria-expanded') === 'true' || false;
            $(this).attr('aria-expanded', !isExpanded);
        });
    }


    /**
     * Logic for single game page (single-game.php) or game as front page
     */
    if ($('body').is('.single-game, .game-as-front-page')) {
        const playButton = $('#playButton');
        const gamePlaceholderImage = $('#gamePlaceholderImage');
        const gameLaunchControls = $('#gameLaunchControls'); 
        const gameIframeWrapper = $('#gameIframeWrapper'); 
        const gameIframe = $('#gameIframe');
        const fullscreenButton = $('#fullscreenButton');
        const gamePostId = $('#starRatingSection').data('post-id');

        function startGame() {
            if (gameLaunchControls.length && gameIframeWrapper.length && gameIframe.length) {
                gameLaunchControls.hide(); 
                
                const encodedGameUrl = gameIframe.data('encoded-src');
                if (encodedGameUrl) {
                    try {
                        const decodedGameUrl = atob(encodedGameUrl);
                        gameIframe.attr('src', decodedGameUrl);
                        gameIframeWrapper.show(); 
                    } catch (e) {
                        console.error('Error decoding game URL:', e);
                        gameIframeWrapper.show().html('<p style="color:white;text-align:center;padding-top:50px;">Could not load game: Invalid URL format.</p>');
                    }
                } else {
                    console.error('Encoded game URL (data-encoded-src) not found on iframe.');
                    gameIframeWrapper.show().html('<p style="color:white;text-align:center;padding-top:50px;">Could not load game: URL not found.</p>');
                }

                if (fullscreenButton.length) {
                    fullscreenButton.css('display', 'inline-block');
                }
            }
        }

        if (playButton.length) playButton.on('click', startGame);
        if (gamePlaceholderImage.length) gamePlaceholderImage.on('click', startGame);

        if (fullscreenButton.length && gameIframeWrapper.length) {
            fullscreenButton.on('click', function() {
                const el = gameIframeWrapper[0]; 
                if (el.requestFullscreen) el.requestFullscreen();
                else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
                else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
                else if (el.msRequestFullscreen) el.msRequestFullscreen();
            });
        }

        const starsContainer = $('#starRatingSection');
        if (starsContainer.length && gamePostId) {
            const stars = starsContainer.find('.star');
            const ratingInfo = $('#ratingInfo');
            const currentRatingSpan = $('#currentRating');
            const storageKeyRating = 'game_' + gamePostId + '_rating';
            let userRating = localStorage.getItem(storageKeyRating);
            let ratingVoted = !!userRating;

            function setRatingDisplay(ratingValue, isInitialLoad = false) {
                stars.removeClass('selected hovered'); 
                stars.each(function(index) {
                    if (index < ratingValue) {
                        $(this).addClass('selected');
                    }
                });

                if (ratingValue > 0) {
                    currentRatingSpan.text(ratingValue + '/5');
                    if (!isInitialLoad && ratingVoted) {
                        ratingInfo.contents().first()[0].textContent = 'Thanks for your vote! (Your vote: ';
                    } else if (isInitialLoad && ratingVoted) {
                         ratingInfo.contents().first()[0].textContent = 'Rate the game! (Your vote: ';
                    }
                } else {
                    currentRatingSpan.text('none');
                     ratingInfo.contents().first()[0].textContent = 'Rate the game! (Your vote: ';
                }
            }
            
            if (userRating) setRatingDisplay(parseInt(userRating), true);
            else {
                 currentRatingSpan.text('none');
                 ratingInfo.contents().first()[0].textContent = 'Rate the game! (Your vote: ';
            }

            stars.on('mouseover', function() {
                if (ratingVoted && userRating > 0) return; 
                const hoverValue = parseInt($(this).data('value'));
                stars.each(function(index) {
                    if (index < hoverValue) {
                        $(this).addClass('hovered');
                    } else {
                        $(this).removeClass('hovered');
                    }
                });
            }).on('mouseout', function() {
                 if (ratingVoted && userRating > 0) return;
                 stars.removeClass('hovered'); 
            }).on('click', function() {
                const newRating = parseInt($(this).data('value'));
                userRating = newRating;
                localStorage.setItem(storageKeyRating, userRating);
                ratingVoted = true; 
                setRatingDisplay(userRating, false);
                stars.removeClass('hovered'); 
            });

            starsContainer.on('mouseleave', function() {
                if (userRating) { 
                    setRatingDisplay(parseInt(userRating), true); 
                } else {
                    stars.removeClass('selected hovered'); 
                }
            });
        }


        const commentsSection = $('#local-comments-section');
        if (commentsSection.length && gamePostId) {
            const commentsList = $('#localCommentsList');
            const commentForm = $('#localCommentForm');
            const commentAuthorInput = $('#commentAuthor');
            const commentTextInput = $('#commentText');
            const storageKeyComments = 'game_' + gamePostId + '_comments';

            function loadComments() {
                const comments = JSON.parse(localStorage.getItem(storageKeyComments) || '[]');
                commentsList.empty();
                if (comments.length === 0) {
                    commentsList.append('<p>No comments yet. Be the first!</p>');
                    return;
                }
                comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                comments.forEach(comment => {
                    const commentDate = new Date(comment.timestamp).toLocaleString();
                    const commentHTML = `
                        <div class="comment-item">
                            <div class="comment-author">${escapeHTML(comment.author)}</div>
                            <div class="comment-date">${commentDate}</div>
                            <div class="comment-text"><p>${escapeHTML(comment.text).replace(/\n/g, '<br>')}</p></div>
                        </div>
                    `;
                    commentsList.append(commentHTML);
                });
            }
            commentForm.on('submit', function(e) {
                e.preventDefault();
                const author = commentAuthorInput.val().trim();
                const text = commentTextInput.val().trim();
                if (!author || !text) {
                    alert('Please fill in both name and comment fields.');
                    return;
                }
                const newComment = { author: author, text: text, timestamp: new Date().toISOString() };
                const comments = JSON.parse(localStorage.getItem(storageKeyComments) || '[]');
                comments.push(newComment);
                localStorage.setItem(storageKeyComments, JSON.stringify(comments));
                loadComments();
                commentAuthorInput.val(''); 
                commentTextInput.val(''); 
            });
            loadComments();
        }
        function escapeHTML(str) {
            var p = document.createElement("p");
            p.appendChild(document.createTextNode(str || '')); 
            return p.innerHTML;
        }
    }

    // Логика "Load More" удалена
    // const loadMoreBtn = $('#loadMoreBtn');
    // if (loadMoreBtn.length) { ... }
});
