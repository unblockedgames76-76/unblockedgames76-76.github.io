// assets/js/main.js
jQuery(document).ready(function($) {

    /**
     * Live Search Logic
     */
    const searchInput = $('#searchInput');
    const searchResultsContainer = $('#liveSearchResults');
    let searchTimeout;

    if (searchInput.length && searchResultsContainer.length) {
        searchInput.on('keyup', function() {
            clearTimeout(searchTimeout);
            const query = $(this).val();

            if (query.length > 2) { // Minimum characters to trigger search
                searchResultsContainer.html('<p>' + 'Loading...' + '</p>').show(); // Basic loading text
                searchTimeout = setTimeout(function() {
                    $.ajax({
                        url: igroport_ajax.ajax_url,
                        type: 'POST',
                        data: {
                            action: 'live_search_games',
                            query: query,
                            nonce: igroport_ajax.live_search_nonce
                        },
                        success: function(response) {
                            if (response.success) {
                                searchResultsContainer.html(response.data.html).show();
                            } else {
                                searchResultsContainer.html('<p>' + (response.data.html || 'Error loading results.') + '</p>').show();
                            }
                        },
                        error: function() {
                            searchResultsContainer.html('<p>' + 'Search request failed.' + '</p>').show();
                        }
                    });
                }, 500); // Debounce time: 500ms
            } else {
                searchResultsContainer.empty().hide();
            }
        });

        // Hide results when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.search-container').length) {
                searchResultsContainer.empty().hide();
            }
        });
        
        // Prevent hiding when clicking inside search input itself
        searchInput.on('focus', function() {
            if (searchResultsContainer.html() !== '') { // Only show if there's content (e.g. after typing)
                 if ($(this).val().length > 2) searchResultsContainer.show();
            }
        });
    }


    /**
     * Logic for single game page (single-game.php) or game as front page
     */
    if ($('body').is('.single-game, .game-as-front-page')) {
        const playButton = $('#playButton');
        const gamePlaceholderImage = $('#gamePlaceholderImage');
        const gameLaunchControls = $('#gameLaunchControls'); // Container for placeholder and play button
        const gameIframeWrapper = $('#gameIframeWrapper'); // Wrapper for the iframe
        const gameIframe = $('#gameIframe');
        const fullscreenButton = $('#fullscreenButton');
        const gamePostId = $('#starRatingSection').data('post-id');

        function startGame() {
            if (gameLaunchControls.length && gameIframeWrapper.length && gameIframe.length) {
                gameLaunchControls.hide(); // Hide placeholder and play button container
                
                const encodedGameUrl = gameIframe.data('encoded-src');
                if (encodedGameUrl) {
                    try {
                        const decodedGameUrl = atob(encodedGameUrl);
                        gameIframe.attr('src', decodedGameUrl);
                        gameIframeWrapper.show(); // Show iframe wrapper
                    } catch (e) {
                        console.error('Error decoding game URL:', e);
                        // If gameIframeWrapper was hidden, show it to display error
                        gameIframeWrapper.show().html('<p style="color:white;text-align:center;padding-top:50px;">Could not load game: Invalid URL format.</p>');
                    }
                } else {
                    console.error('Encoded game URL (data-encoded-src) not found on iframe.');
                     // If gameIframeWrapper was hidden, show it to display error
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
                const el = gameIframeWrapper[0]; // Target the iframe wrapper for fullscreen
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

    /**
     * Logic for "Load More"
     */
    const loadMoreBtn = $('#loadMoreBtn');
    if (loadMoreBtn.length) {
        let currentMaxPages = parseInt(loadMoreBtn.data('max-pages'));

        loadMoreBtn.on('click', function() {
            const button = $(this);
            let currentPage = parseInt(button.data('paged'));
            const maxPagesToCompare = currentMaxPages || parseInt(button.data('max-pages'));

            button.text('Loading...');

            $.ajax({
                url: igroport_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'load_more_games',
                    paged: currentPage,
                    nonce: igroport_ajax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        $('#gamesGrid').append(response.data.html);
                        currentPage++;
                        button.data('paged', currentPage);
                        
                        if (response.data.max_pages) {
                            currentMaxPages = parseInt(response.data.max_pages);
                        }

                        if (currentPage > currentMaxPages) {
                            button.addClass('hidden').hide();
                        } else {
                             button.text('Load More Games');
                        }
                    } else {
                        button.text('No More Games');
                        console.log('Load more error:', response.data.message);
                        button.addClass('hidden').hide();
                    }
                },
                error: function(errorThrown) {
                    console.error('AJAX error:', errorThrown);
                    button.text('Loading Error');
                }
            });
        });
    }
});
