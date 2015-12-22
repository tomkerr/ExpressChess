"use strict";
var GameLogic = function GameLogic(player, boardLayout, chessBoard) {
    this.player = player;
    this.boardLayout = boardLayout;
    this.chessBoard = chessBoard;
    this.oppenentColour = "";
    this.oppenentPiece(); // sets this.oppenentColour
	
    this.squareContainsPiece = false;
    this.pieceOnSquare;

    this.pieceType = "";
    this.prevSquare; // object that was on prev square clicked
    this.square;	// object thats on the current square clicked
    // store mouse co-ordinates
    this.y;
    this.x;
    this.prevY;
    this.prevX;
    // used to get king co-ordinates
    this.kingY;
    this.kingX;
    this.oppKingY;
    this.oppKingX;

    this.pieceMoved = false;
    this.validMove = false;
    this.check = false; 		// are WE in check?
    this.checkmate = false;		// have we put oppenent in checkmate?
    this.beingAttacked = false;
    this.safeSpace = false; // found a safe space to move to?

}

// set the colour of the opponent, called when game is being set up
GameLogic.prototype.oppenentPiece = function () {
    if (this.player.colourPieces === "white") {
        this.oppenentColour = "black";
    } else { this.oppenentColour = "white"; }
}

// used in if statement after a valid 2nd click
// this should return true if move is valid
GameLogic.prototype.checkMove = function () {
    // first assign variables with data from attempted move to make future code more readable
    this.y = this.chessBoard.squareClickedY;
    this.x = this.chessBoard.squareClickedX;
    this.prevY = this.chessBoard.prevSquareClickedY;
    this.prevX = this.chessBoard.prevSquareClickedX;
    this.prevSquare = this.boardLayout.pieceLayout[this.chessBoard.prevSquareClickedY][this.chessBoard.prevSquareClickedX];
    this.Square = this.boardLayout.pieceLayout[this.chessBoard.squareClickedY][this.chessBoard.squareClickedX];
    this.pieceType = this.prevSquare.pieceType;
    // check if piece has moved previously, effects pawns etc
    this.hasPieceMoved();
    // call the correct method depending on which piece was selected by player
    switch (this.pieceType) {
        case "pawn":
            this.checkPawnMove();
            break;
        case "king":
            this.checkKingMove();
            break;
        case "queen": // queen uses both validLineMove() and validDiagionalMove()
            this.checkQueenMove();
            break;
        case "rook": // call method used by queen
            this.validLineMove();
            break;
        case "bishop": // call method used by queen
            this.validDiagonalMove();
            break;
        case "knight":
            this.validKnightMove();
            break;
        default: // this should never happen
            console.log("not sure what you picked up...");
    }
	
    // will King be in check if move happens? last chance to change validMove to false;
    this.inCheck();
    // have we put oppenent in checkmate?
    //this.putOppenentInCheck();
    // if true move will be allowed, if false move will be reset in app.js
    return this.validMove;
}
// next series of methods validate moves, switch statement in checkMove calls the correct one
GameLogic.prototype.checkPawnMove = function () {
    // pawns can only move in one direction depending on the colour
    var validForwardSquares = [];
    if (this.player.colourPieces === "white") {
        validForwardSquares = [-1, -2];
    }
    if (this.player.colourPieces === "black") {
        validForwardSquares = [1, 2];
    }

    // checking for a valid capture (pawn may capture one square diagonally forwards)
    validCapture.call(this, validForwardSquares[0]);
    // checking for valid move forward
    if (this.pieceMoved) { // if pawn has moved before, can only move one square forward
        // call allows to set the context in the function of 'this'
        validPawnMoveForward.call(this, validForwardSquares[0]); // 0=1
    }
    else { // pawn may move 1 or 2 squares forward
        validPawnMoveForward.call(this, validForwardSquares[0]); // 0=1
        validPawnMoveForward.call(this, validForwardSquares[1]); // 1=2
    }
	
    // function to check if pawn can move forward legally 
    function validPawnMoveForward(num) {
        // if click is 1 or 2 squares forward AND identical x co-ordinates of both clicks
        if (this.y === this.prevY + num && this.x === this.prevX) {
            // y = difference between squareclicked and prevSquare clicked
            var y = 0;
            if (num < 0) { // white pieces
                y = this.prevY - this.y; // 1st click - 2nd click
            } else { // black pieces
                y = this.y - this.prevY; // 2nd click - 1st click
            }
            // looping through squares checking for pieces blocking the way
            for (var i = 0; i < y; i++) {
                if (num < 0) {
                    // white pawn, iterate back from square clicked to prevsquare clicked
                    this.squareHasPiece(this.y + i, this.x);
                } else {
                    // black pawn, iterate forward from square clicked to prevsquare clicked
                    this.squareHasPiece(this.y - i, this.x);
                }
            }
            // if no pieces in the way, its a valid move
            this.pieceInTheWay();
        }
    } // validPawnMoveForward()
	
    function validCapture(num) {
        // if click was one row away from prevClick AND one column to the left OR one column to the right
        if ((this.y === this.prevY + num) && (this.x === this.prevX + num || this.x === this.prevX - num)) {
            // does the square clicked on contain a piece, remember click on own piece has already been checked
            this.squareHasPiece(this.y, this.x);
            // if square contains a piece its a valid move
            if (this.squareContainsPiece) {
                this.validMove = true;
            }
        }
    } // validCapture()
} // checkPawnMove()


GameLogic.prototype.checkKingMove = function () {
    // click was on the same row
    if (this.y === this.prevY) {
        // can only move left or right since 2nd click on king is not valid
        if (this.x === this.prevX - 1 || this.x === this.prevX + 1) {
            this.validMove = true;
        }
    }
    // click was one above
    if (this.y === this.prevY + 1) {
        checkX.call(this);
    }
    // click was one below
    if (this.y === this.prevY + -1) {
        checkX.call(this);
    }
    // checks x co-ordinate left, middle then right
    function checkX() {
        if (this.x === this.prevX - 1 || this.x === this.prevX || this.x === this.prevX + 1) {
            this.validMove = true;
        }
    }
}

GameLogic.prototype.checkQueenMove = function () {
    // remember already checked for clicks on own pieces
    this.validLineMove();
    this.validDiagonalMove();
}

// rooks, queens
GameLogic.prototype.validLineMove = function () {
    // only a valid line move if one of these is exactly true
    if (this.x === this.prevX || this.y === this.prevY) {
        // now check the 4 possible directions
        //////////////////////////////////////////////////////////////
        if (this.y < this.prevY) { // attempt to move upwards
            var y = 1;
            // just one square up, don't worry about pieces in the way, since click on own piece is already checked
            if (this.y + y === this.prevY) {
                this.validMove = true;
            }
            // else this condition will be true, check for pieces blocking the path
            while (this.y + y < this.prevY) {
                // check each square inbetween for a piece
                this.squareHasPiece(this.y + y, this.x);
                // will switch validMove bool depending if a piece was in the way
                this.pieceInTheWay();
                y++;
            }
        }
        /////////////////////////////////////////////////////////////
        if (this.y > this.prevY) { // attempt to move downwards
            var y = -1;
            if (this.y + y === this.prevY) {
                this.validMove = true;
            }
            while (this.y + y > this.prevY) {
                this.squareHasPiece(this.y + y, this.x);
                this.pieceInTheWay();
                y--;
            }
        }
        //////////////////////////////////////////////////////////////
        if (this.x < this.prevX) { // attempt to move left
            var x = 1;
            if (this.x + x === this.prevX) {
                this.validMove = true;
            }
            while (this.x + x < this.prevX) {
                this.squareHasPiece(this.y, this.x + x);
                this.pieceInTheWay();
                x++;
            }
        }
        //////////////////////////////////////////////////////////////
        if (this.x > this.prevX) { // attempt to move right
            var x = -1;
            if (this.x + x === this.prevX) {
                this.validMove = true;
            }
            while (this.x + x > this.prevX) {
                this.squareHasPiece(this.y, this.x + x);
                this.pieceInTheWay();
                x--;
            }
        }
    } // if (this.x === this.prevX || this.y === this.prevY)
}

// bishops, queens
GameLogic.prototype.validDiagonalMove = function () {
    var i, j;
    // loop through NE diagonal squares
    for (i = this.prevY - 1, j = this.prevX + 1; i >= this.y && j <= this.x; i-- , j++) {
        checkSquare.call(this, i, j);
        if (this.squareContainsPiece) {
            this.squareContainsPiece = false; // ready for next check
            break; // piece in the way, reject move attempt
        }
    }
    // loop through SE diagonal squares
    for (i = this.prevY + 1, j = this.prevX + 1; i <= this.y && j <= this.x; i++ , j++) {
        checkSquare.call(this, i, j);
        if (this.squareContainsPiece) {
            this.squareContainsPiece = false; // ready for next check
            break; // piece in the way, reject move attempt
        }
    }
    // loop through SW diagonal squares
    for (i = this.prevY + 1, j = this.prevX - 1; i <= this.y && j >= this.x; i++ , j--) {
        checkSquare.call(this, i, j);
        if (this.squareContainsPiece) {
            this.squareContainsPiece = false; // ready for next check
            break; // piece in the way, reject move attempt
        }
    }
    // loop through NW diagonal squares
    for (i = this.prevY - 1, j = this.prevX - 1; i >= this.y && j >= this.x; i-- , j--) {
        checkSquare.call(this, i, j);
        if (this.squareContainsPiece) {
            this.squareContainsPiece = false; // ready for next check
            break; // piece in the way, reject move attempt
        }
    }

    function checkSquare(y, x) {
        // if we are checking the square clicked DON'T do this - it will block attack attempt
        if (this.y !== y && this.x !== x) {
            if (this.boardLayout.pieceLayout[y][x] !== null) {
                // there is a piece blocking the path, the for loop calling this will now break out
                this.squareContainsPiece = true;
            }
        }
        // if click is the same as the attributes passed into the function we have a valid move
        if (this.y === y && this.x === x) {
            this.validMove = true;
        }
    }
}

// checks for the 8 possible moves, don't have to worry about pieces in the way or off-board co-ords
GameLogic.prototype.validKnightMove = function () {
    if ((this.y === this.prevY - 1) && (this.x === this.prevX - 2 || this.x === this.prevX + 2)) {
        this.validMove = true;
    }
    if ((this.y === this.prevY - 2) && (this.x === this.prevX - 1 || this.x === this.prevX + 1)) {
        this.validMove = true;
    }
    if ((this.y === this.prevY + 1) && (this.x === this.prevX - 2 || this.x === this.prevX + 2)) {
        this.validMove = true;
    }
    if ((this.y === this.prevY + 2) && (this.x === this.prevX - 1 || this.x === this.prevX + 1)) {
        this.validMove = true;
    }
}
// will the player attempted move leave them in check?
GameLogic.prototype.inCheck = function () {
    // temp make move so we can check
    this.movePiece();
    // where is our king?
    this.findKings();
    // our King in check? 
    this.underAttack(this.kingY, this.kingX);
    
    // did beingAttacked bool get switched to true?
    if (this.beingAttacked) {
        // in that case we are in check, so can't make that move
        this.validMove = false;
        this.check = true;
        // set to false ready for next check
        this.beingAttacked = false
        console.log("You are in check");
    }
    // now put the game state back to how it was
    this.undoMove();
}

GameLogic.prototype.pieceInTheWay = function () {
    if (!this.squareContainsPiece) {
        this.validMove = true;
        console.log("piece in the way");
    } else { // if a piece is blocking, invalid move
        this.validMove = false;
    }
}

// find our own king
GameLogic.prototype.findKings = function () {
    // find king of our colour in data structure
    for (var row = 0; row < 8; row++) {
        for (var col = 0; col < 8; col++) {
            if (this.boardLayout.pieceLayout[row][col] !== null) {
                if (this.boardLayout.pieceLayout[row][col].pieceType === "king" && this.boardLayout.pieceLayout[row][col].color === this.player.colourPieces) {
                    this.kingY = row;
                    this.kingX = col;
                    console.log("found king at " + row + " " + col);
                } // if square contains our King

                if (this.boardLayout.pieceLayout[row][col].pieceType === "king" && this.boardLayout.pieceLayout[row][col].color === this.oppenentColour) {
                    this.oppKingY = row;
                    this.oppKingX = col;
                    console.log("found king at " + row + " " + col);
                } // if square contains our King
            } // if square !== null
        }	// for col
    }	// for row
}

// have we put the oppenent in checkmate?? -> WINNER
GameLogic.prototype.inCheckMate = function () {
    // check all possible king moves - still in check for each one?
    console.log(this.kingY + " " + this.kingX);
    if (this.kingY === 0) { // can't move up
        // one square
        checkLeft.call(this, this.kingY, this.kingX);
    }
    if (this.kingY === 7) { // can't move down
        
    }
    if (this.kingX === 0) { // can't move left
        
    }
    if (this.kingX === 7) { // can't move right
        
    }
    // check all directions
    if ((this.kingY > 0 && this.kingY < 7) && (this.kingX > 0 && this.kingX < 7)) {

    }

    function checkLeft(y, x) {
        this.squareHasPiece(y, x - 1);
        // only attempt if square doen not contain own piece
        if (this.pieceOnSquare.color !== this.player.colourPieces) {
            this.movePiece(y, x - 1, y, x);
            // still under attack here?
            this.underAttack(y, x - 1);
            if (!this.beingAttacked) {
                this.safeSpace = true;
            }
        }
    }

    function checkRight() {

    }
    
    // can a piece block the check?
    
    // can the piece threatening the king be attacked?
}

// is the y and x co-ordinate given under attack from an enemy piece?
GameLogic.prototype.underAttack = function (y, x) {
    var i, j;
    // first check along the straight lines
    // how far do we need to check upwards? worry about queen, rooks and king
    // i = y -1 as don't need to check own square
    for (i = y - 1; i >= 0; i--) {
        this.squareHasPiece(i, x);
        if (this.squareContainsPiece) {
            // we found a piece, check what it was
            checkLines.call(this, i, x);
            this.squareContainsPiece = false // ready for next for loop	
            break; // break as we are only concerned with the first piece in the way
        }
    }
    // how far right? worry about queen, rooks and king
    for (i = x + 1; i <= 7; i++) {
        this.squareHasPiece(y, i);
        if (this.squareContainsPiece) {
            checkLines.call(this, y, i);
            this.squareContainsPiece = false // ready for next for loop	
            break; // break as we are only concerned with the first piece in the way
        }
    }
    // how far downwards? worry about queen, rooks and king
    for (i = y + 1; i <= 7; i++) {
        this.squareHasPiece(i, x);
        if (this.squareContainsPiece) {
            checkLines.call(this, i, x);
            this.squareContainsPiece = false // ready for next for loop	
            break; // break as we are only concerned with the first piece in the way
        }
    }
    // how far left? worry about queen, rooks and king
    for (i = x - 1; i >= 0; i--) {
        this.squareHasPiece(y, i);
        if (this.squareContainsPiece) {
            checkLines.call(this, y, i);
            this.squareContainsPiece = false // ready for next for loop	
            break; // break as we are only concerned with the first piece in the way
        }
    }
    // is the piece found threatening?
    function checkLines(row, col) {   
        // only check further if the piece is the oppenents
        this.pieceOnSquare = this.boardLayout.pieceLayout[row][col];
        //if (this.boardLayout.pieceLayout[row][col].color === this.oppenentColour) {
        if (this.pieceOnSquare !== null) {
            if (this.pieceOnSquare.color === this.oppenentColour) {
                // is there a enemy queen or rook
                if (this.pieceOnSquare.pieceType === "queen" || this.pieceOnSquare.pieceType === "rook") {
                    this.beingAttacked = true;
                }
            
                // is there an enemy king next to us?
                // checks one square directly UP, LEFT, RIGHT then DOWN - if any of these are true then beingAttacked = true = true
                if ((row === y - 1 && col === x) || (row === y && col === x - 1 || col === x + 1) || (row === y + 1 && col === x)) {
                    if (this.pieceOnSquare.pieceType === "king") {
                        this.beingAttacked = true;
                    }
                }
            }
        }
    }
    
    /************************************************************************/
    // now check along the diagonals
    // NE diagonal? Worry about bishop, queen, pawn, king
    for (i = y - 1, j = x + 1; i >= 0 && j <= 7; i-- , j++) {
        // check each square for a piece
        this.squareHasPiece(i, j);
        console.log(i + " " + j);
        // if we found one, check what it is and if its a danger
        if (this.squareContainsPiece) {
            checkDiagonals.call(this, i, j);
            this.squareContainsPiece = false // ready for next for loop	 
            break; // break as we are only concerned with the first piece in the way
        }
    }
    // SE diagonal? Worry about bishop, queen, pawn, king
    for (i = y + 1, j = x + 1; i <= 7 && j <= 7; i++ , j++) {
        this.squareHasPiece(i, j);
        if (this.squareContainsPiece) {
            checkDiagonals.call(this, i, j);
            this.squareContainsPiece = false // ready for next for loop	
            break; // break as we are only concerned with the first piece in the way
        }
    }
    // SW diagonal? Worry about bishop, queen, pawn, king
    for (i = y + 1, j = x - 1; i <= 7 && j >= 0; i++ , j--) {
        this.squareHasPiece(i, j);
        if (this.squareContainsPiece) {
            checkDiagonals.call(this, i, j);
            this.squareContainsPiece = false // ready for next for loop	
            break; // break as we are only concerned with the first piece in the way
        }
    }
    // NW diagonal? Worry about bishop, queen, pawn, king
    for (i = y - 1, j = x - 1; i >= 0 && j >= 0; i-- , j--) {
        this.squareHasPiece(i, j);
        if (this.squareContainsPiece) {
            checkDiagonals.call(this, i, j);
            this.squareContainsPiece = false // ready for next for loop	
            break; // break as we are only concerned with the first piece in the way
        }
    }
    function checkDiagonals(row, col) {
        // only check further if the piece is the oppenents
        if (this.pieceOnSquare.color === this.oppenentColour) {
            // pawns first
            var i = -1; // default checking for black pawns -1 on the y axis
            if (this.oppenentColour === "white") {
                i = 1; // or check +1 on the y axis
            }
            // row plus (+1 or -1) AND col -1 OR col + 1 - looking for pawn one square diagonally
            if ((row === y + i) && (col === x - 1 || col === x + 1)) {
                if (this.pieceOnSquare.pieceType === "pawn") {
                    this.beingAttacked = true;
                }
            }
            // is there a king next to us?
            // checks one square NW, NE, SW and SE
            if ((row === y - 1 && col === x - 1 || col === x + 1) || (row === y + 1 && col === x - 1 || col === x + 1)) {
                if (this.pieceOnSquare.pieceType === "king") {
                    this.beingAttacked = true;
                }
            }
            // is there an enemy queen or bishop?
            if (this.pieceOnSquare.pieceType === "queen" || this.pieceOnSquare.pieceType === "bishop") {
                this.beingAttacked = true;
            }
        } // else - first piece in the way was own colour, don't worry about it
    }
 
    /******************************************************************************* */
    // check for enemy knight - checks 8 possible positions around piece
    // i'm sure there is a better way to do this, but my head is hurting too much right now
    this.squareHasPiece(y - 1, x - 2);
    this.checkForKnight();
    this.squareHasPiece(y - 2, x - 1);
    this.checkForKnight();
    this.squareHasPiece(y - 2, x + 1);
    this.checkForKnight();
    this.squareHasPiece(y - 1, x + 2);
    this.checkForKnight();

    this.squareHasPiece(y + 1, x + 2);
    this.checkForKnight();
    this.squareHasPiece(y + 2, x + 1);
    this.checkForKnight();
    this.squareHasPiece(y + 2, x - 1);
    this.checkForKnight();
    this.squareHasPiece(y + 1, x - 2);
    this.checkForKnight();
}

GameLogic.prototype.checkForKnight = function () {
    // has to be opp colour and a knight
    if (this.pieceOnSquare.color === this.oppenentColour && this.pieceOnSquare.pieceType === "knight") {
        this.beingAttacked = true;
    }
}

// method to check if square has a piece
// already checked user hasn't clicked on own piece on second click
GameLogic.prototype.squareHasPiece = function (row, col) {
    // already checked click wasn't on own pieces
    // only check valid squares on chessboard
    if (row > -1 && row < 8 && col > -1 && col < 8) {
        // if not equal to null then we have found a piece
        if (this.boardLayout.pieceLayout[row][col] !== null) {
            // found a piece
            this.squareContainsPiece = true;
            this.pieceOnSquare = this.boardLayout.pieceLayout[row][col];
        }
    }
}

GameLogic.prototype.hasPieceMoved = function () {
    if (this.prevSquare.moveCount !== 0) {
        this.pieceMoved = true;
    }
}
/************************************************************************************/
// sometimes we will make the move temporalily to check potential game state before
// validating the move (check), use the existing movePiece method to do so then call
// undoMove after to return the game to how it was

// this is called for final move and if the program needs to make a temp move to check potential state of board
GameLogic.prototype.movePiece = function (toY, toX, fromY, fromX) {
    // if no parameters are passed use the mouse clicks by default
    if (toY === undefined) toY = this.chessBoard.squareClickedY;
    if (toX === undefined) toX = this.chessBoard.squareClickedX;
    if (fromY === undefined) fromY = this.chessBoard.prevSquareClickedY;
    if (fromX === undefined) fromX = this.chessBoard.prevSquareClickedX;

    this.pieceHolder = this.boardLayout.pieceLayout[fromY][fromX];
    this.oppPieceHolder = this.boardLayout.pieceLayout[toY][toX];
    // now assign previous square to null
    this.boardLayout.pieceLayout[fromY][fromX] = null;
    // move temp object to the new square clicked
    this.boardLayout.pieceLayout[toY][toX] = this.pieceHolder;
}

// this will reset the move
GameLogic.prototype.undoMove = function () {
    this.boardLayout.pieceLayout[this.chessBoard.squareClickedY][this.chessBoard.squareClickedX] = this.oppPieceHolder;
    this.boardLayout.pieceLayout[this.chessBoard.prevSquareClickedY][this.chessBoard.prevSquareClickedX] = this.pieceHolder;
}

GameLogic.prototype.incMoveCount = function () {
    // add one to the move count
    this.boardLayout.pieceLayout[this.chessBoard.squareClickedY][this.chessBoard.squareClickedX].moveCount++;
}

// resets variables, used to reset move on unvalid clicks too
GameLogic.prototype.endMove = function () {
    this.chessBoard.prevSquareClickedX = 0;
    this.chessBoard.prevSquareClickedY = 0;
    this.chessBoard.squareClickedX = 0;
    this.chessBoard.squareClickedY = 0;
    this.squareContainsPiece = false;
    this.pieceMoved = false;
    this.validMove = false;
    this.check = false;
}


