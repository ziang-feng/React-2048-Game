import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

const CELL_SIZE = 8;
const MARGIN = 0.5;
const TRANSTIME = 80;

const BACKEND_ADDRESS = './api/game.php';

var mergeAni = [];
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            size: 4,
            score: 0,
            gameNum: 0,
            loadTS: "",
            loadJSON: "",
            boardJSON: "",
            modalOpen: false,
            modalState: '',
            user: "Sign in",
            sessionKey:"",
            identityKey:""
        }
        this.newGame = this.newGame.bind(this);
        this.loadGame = this.loadGame.bind(this);
        this.setScore = this.setScore.bind(this);
        this.setJSON = this.setJSON.bind(this);
        this.setUsername = this.setUsername.bind(this);
        this.hideMainModal = this.hideMainModal.bind(this);
        this.showMainModal = this.showMainModal.bind(this);
        this.hideMainModalCB = this.hideMainModalCB.bind(this);
        this.setModalState = this.setModalState.bind(this);
        this.clearLogin = this.clearLogin.bind(this);
    }
    componentDidUpdate(prevProps, prevState) {

    }
    newGame(size) {
        let newGameNum = this.state.gameNum + 1;
        this.setState({ size: size, score: 0, boardJSON: "", gameNum: newGameNum, loadTS: "", loadJSON: "" });
    }
    loadGame(boardJSON, size, score, ts) {
        let newGameNum = this.state.gameNum + 1;
        this.setState({ size: parseInt(size), score: parseInt(score), loadJSON: boardJSON, gameNum: newGameNum, loadTS: ts });
    }
    setScore(score) {
        this.setState({ score: score });
    }
    setJSON(string) {
        this.setState({ boardJSON: string });
    }
    setUsername(username) { this.setState({ user: username }); }
    clearLogin(){
        this.setState({user:"Sign in",sessionKey:"",identityKey:""})
    }
    showMainModal() {
        let modal = document.getElementById('mainModal');
        modal.removeEventListener("animationend", this.hideMainModalCB);
        $('#mainModal').removeClass("d-none custom-fadeOut").addClass("custom-fadeIn d-flex");
        $('#modalBackdrop').removeClass("d-none custom-fadeOut-simple").addClass("custom-fadeIn-simple d-flex");
        this.setState({ modalOpen: true });
    }
    hideMainModal() {
        if ($('#mainModal').hasClass('d-none') || $('#mainModal').hasClass('custom-fadeOut')) return; // hidding is in transition
        $('#mainModal').removeClass("custom-fadeIn d-flex").addClass("custom-fadeOut");
        $('#modalBackdrop').removeClass("custom-fadeIn-simple d-flex").addClass("custom-fadeOut-simple");
        let modal = document.getElementById('mainModal');
        modal.addEventListener("animationend", this.hideMainModalCB);
        this.setState({ modalOpen: false, modalState: '' });
    }
    hideMainModalCB() {
        let modal = document.getElementById('mainModal');
        modal.removeEventListener("animationend", this.hideMainModalCB);
        $('#mainModal').removeClass("custom-fadeOut").addClass("d-none");
        $('#modalBackdrop').removeClass("custom-fadeOut-simple").addClass("d-none");
    }
    setModalState(state) {
        this.setState({ modalState: state })
    }
    render() {
        return (
            <div className="h-100 w-100">
                <div className="d-flex flex-column p-4 m-auto">
                    <div className="mb-3 d-flex flex-row w-100">
                        <div className="b-round score w-100 shadow d-flex mr-3">
                            <div className="m-auto">{numberWithCommas(this.state.score)}</div>
                        </div>
                        <button className="d-flex flex-row mr-3 b-round shadow bt" onClick={() => { this.setState({ modalState: "highscore" }); this.showMainModal(); }}>
                            <i className="fas fa-trophy my-auto mx-4"></i>
                        </button>
                        <button className="d-flex flex-row b-round shadow bt" onClick={() => {
                            if (this.state.user == "Sign in") this.setState({ modalState: "signin" });
                            else this.setState({ modalState: "logout" });
                            this.showMainModal();
                        }}>
                            <i className="fas fa-user my-auto ml-4 mr-2"></i>
                            <div className="mr-4 my-auto">{this.state.user}</div>
                        </button>
                    </div>
                    <Game size={this.state.size} setScore={this.setScore} score={this.state.score} setJSON={this.setJSON} modalOpen={this.state.modalOpen} loadJSON={this.state.loadJSON} setModalState={this.setModalState} showMainModal={this.showMainModal} user={this.state.user} key={`game_${this.state.size}_${this.state.gameNum}_${this.state.loadTS}`} />
                    <div className="mt-3 d-flex flex-row w-100">
                        <button className="d-flex flex-row b-round shadow bt mr-auto" onClick={() => { this.setState({ modalState: "newGame" }); this.showMainModal(); }}>
                            <i className="fas fa-undo my-auto ml-4 mr-2"></i>
                            <div className="mr-4 my-auto">New Game</div>
                        </button>
                        <button className="d-flex flex-row b-round shadow bt mr-3" onClick={() => {
                            if (this.state.user != "Sign in") this.setState({ modalState: "save" });
                            else this.setState({ modalState: "signin" });
                            this.showMainModal();
                        }}>
                            <i className="fas fa-cloud-upload-alt my-auto ml-4 mr-2"></i>
                            <div className="mr-4 my-auto">Save</div>
                        </button>
                        <button className="d-flex flex-row b-round shadow bt" onClick={() => {
                            if (this.state.user != "Sign in") this.setState({ modalState: "load" });
                            else this.setState({ modalState: "signin" });
                            this.showMainModal();
                        }}>
                            <i className="fas fa-cloud-download-alt my-auto ml-4 mr-2"></i>
                            <div className="mr-4 my-auto">Load</div>
                        </button>
                    </div>
                </div>
                <Modal hideMainModal={this.hideMainModal} modalState={this.state.modalState} size={this.state.size} newGame={this.newGame} setModalState={this.setModalState} setUsername={this.setUsername} boardJSON={this.state.boardJSON} score={this.state.score} loadGame={this.loadGame} clearLogin={this.clearLogin} setParentState={this.setState}/>
                <div className="C_modal_backdrop d-none" id="modalBackdrop" />
            </div>
        )
    }
}
class Modal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newSize: 4,
            username: "",
            password: "",
            usernameSU: "",
            passwordSU: "",
            passwordC: "",
            fetchContent: {},
            checking: false
        }
        this.newGame = this.newGame.bind(this);
        this.signinFetch = this.signinFetch.bind(this);
        this.signupFetch = this.signupFetch.bind(this);
        this.logoutFetch = this.logoutFetch.bind(this);
        this.scoreFetch = this.scoreFetch.bind(this);
        this.loadFetch = this.loadFetch.bind(this);
        this.saveFetch = this.saveFetch.bind(this);
    }
    componentDidUpdate(prevProps, prevState) {
        if (this.props.modalState != prevProps.modalState) {
            this.setState({ fetchContent: "" });
            if (this.props.modalState == "load") this.loadFetch();
            if (this.props.modalState == "highscore") this.scoreFetch();
            // if (["signin", "signup"].includes(this.props.modalState)) {
            //     this.setState({
            //         username: "",
            //         password: "",
            //         usernameSU: "",
            //         passwordSU: "",
            //         passwordC: "",
            //     })
            // }
        }
    }
    newGame() {
        return (
            <div className="d-flex flex-column" style={{ width: "40rem" }}>
                <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                    <div className="modal_title mx-auto mb-4">Choose the board size for a new game</div>
                    <div className="d-flex flex-row justify-content-around mb-4">
                        <button className={`d-flex flex-column b-round bt_border modal_bt ${this.state.newSize == 4 ? "on" : "off"}`} onClick={() => { this.setState({ newSize: 4 }) }}>
                            <i className={`${this.state.newSize == 4 ? "fas fa-check-circle" : "far fa-circle"} mx-auto mt-3 modal_icon ${this.state.newSize == 4 ? "on" : "off"}`}></i>
                            <img className="modal_board_img mt-3 mx-3" src="./img/4.svg" alt="4X4 board" />
                            <div className="mx-auto my-3">4X4</div>
                        </button>
                        <button className={`d-flex flex-column b-round bt_border modal_bt ${this.state.newSize == 5 ? "on" : "off"}`} onClick={() => { this.setState({ newSize: 5 }) }}>
                            <i className={`${this.state.newSize == 5 ? "fas fa-check-circle" : "far fa-circle"} mx-auto mt-3 modal_icon ${this.state.newSize == 5 ? "on" : "off"}`}></i>
                            <img className="modal_board_img mt-3 mx-3" src="./img/5.svg" alt="5X5 board" />
                            <div className="mx-auto my-3">5X5</div>
                        </button>
                        <button className={`d-flex flex-column b-round bt_border modal_bt ${this.state.newSize == 6 ? "on" : "off"}`} onClick={() => { this.setState({ newSize: 6 }) }}>
                            <i className={`${this.state.newSize == 6 ? "fas fa-check-circle" : "far fa-circle"} mx-auto mt-3 modal_icon ${this.state.newSize == 6 ? "on" : "off"}`}></i>
                            <img className="modal_board_img mt-3 mx-3" src="./img/6.svg" alt="6X6 board" />
                            <div className="mx-auto my-3">6X6</div>
                        </button>
                    </div>
                </div>

                <div className="d-flex justify-content-around bg-w b-round p-2">
                    <button className="modal_bt px-3" onClick={this.props.hideMainModal}>Cancel</button>
                    <button className="modal_bt fc-p px-3" onClick={() => { this.props.newGame(this.state.newSize); this.props.hideMainModal() }}>Start</button>
                </div>
            </div>
        )
    }
    signin() {
        return (
            <div className="d-flex flex-column" style={{ width: "25rem" }}>
                <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                    <div className="modal_title mx-auto mb-4">Sign in</div>
                    <form className="d-flex flex-column mb-4 source_san">
                        <div className="mb-4" style={{ position: 'relative' }}><i className="fa fa-user C_login_input_icon" /><input className="C_login_input w-100" placeholder="Username" name="username" maxLength="10" onChange={(e) => { this.setState({ username: e.target.value.replace(/[^0-9a-zA-Z]/gi) }); }} value={this.state.username} type="text" /></div>
                        <div className="" style={{ position: 'relative' }}><i className="fa fa-key C_login_input_icon" /><input className="C_login_input w-100" placeholder="Password" name="password" onChange={(e) => { this.setState({ password: e.target.value }); }} value={this.state.password} type="password" /></div>
                    </form>
                </div>

                <div className="d-flex justify-content-around bg-w b-round p-2">
                    <button className="modal_bt px-3" onClick={this.props.hideMainModal}>Cancel</button>
                    <button className="modal_bt px-3" onClick={() => { this.props.setModalState("signup") }}>Sign up</button>
                    <button className="modal_bt fc-p px-3" onClick={() => { this.signinFetch() }}>Sign in</button>
                </div>
            </div>
        )
    }
    signup() {
        return (
            <div className="d-flex flex-column" style={{ width: "25rem" }}>
                <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                    <div className="modal_title mx-auto mb-4">Sign up</div>
                    <form className="d-flex flex-column mb-4 source_san">
                        <div className="mb-4" style={{ position: 'relative' }}><i className="fa fa-user C_login_input_icon" /><input className="C_login_input w-100" placeholder="Username (alphanumeric, 10 max)" name="usernameSU" maxLength="10" onChange={(e) => { this.setState({ usernameSU: e.target.value.replace(/[^0-9a-zA-Z]/gi, '') }); }} value={this.state.usernameSU} type="text" /></div>
                        <div className="mb-4" style={{ position: 'relative' }}><i className="fa fa-key C_login_input_icon" /><input className="C_login_input w-100" placeholder="Password" name="passwordSU" onChange={(e) => { this.setState({ passwordSU: e.target.value }); }} value={this.state.passwordSU} type="password" /></div>
                        <div className="" style={{ position: 'relative' }}><i className="fa fa-key C_login_input_icon" /><input className="C_login_input w-100" placeholder="Confirm password" name="passwordC" onChange={(e) => { this.setState({ passwordC: e.target.value }); }} value={this.state.passwordC} type="password" /></div>
                    </form>
                </div>

                <div className="d-flex justify-content-around bg-w b-round p-2">
                    <button className="modal_bt px-3" onClick={this.props.hideMainModal}>Cancel</button>
                    <button className="modal_bt fc-p px-3" onClick={() => { this.signupFetch() }}>Confirm</button>
                </div>
            </div>
        )
    }
    async signupFetch() {
        if (this.state.usernameSU && this.state.passwordSU && (this.state.passwordC === this.state.passwordSU)) {
            this.props.setModalState("loading");
            let result = await fetch(`${BACKEND_ADDRESS}?request=signup`, {
                method: 'POST',
                body: JSON.stringify({ username: this.state.usernameSU, password: this.state.passwordSU })
            });
            if (result.status !== 200) {
                this.props.setModalState("error");
                return;
            }
            let data = await result.json();

            if (data[0]) {
                if (data[0] == ".") {
                    this.props.setModalState("dup");
                    return;
                }
                this.props.setModalState("success.signup");
                this.setState({
                    usernameSU: "",
                    passwordSU: "",
                    passwordC: "",
                })
            }
            else this.props.setModalState("error");
        }
        else {
            this.props.setModalState("missing.signup");
        }
    }
    async signinFetch() {
        if (this.state.username && this.state.password) {
            this.props.setModalState("loading");
            let result = await fetch(`${BACKEND_ADDRESS}?request=signin`, {
                method: 'POST',
                body: JSON.stringify({ username: this.state.username, password: this.state.password })
            });

            if (result.status !== 200) {
                this.props.setModalState("error");
                return;
            }
            let data = await result.json();

            if (data[0]) {
                this.props.setUsername(data[0]);
                this.props.setParentState({
                    identityKey:data[1],
                    sessionKey:data[2]
                });
                this.props.setModalState("");
                this.props.hideMainModal();
                this.setState({
                    username: "",
                    password: "",
                })
            }
            else this.props.setModalState("error");
        }
        else {
            this.props.setModalState("missing.signin");
        }
    }
    logoutFetch() {
        // this.props.setModalState("loading");
        // let result = await fetch(`${BACKEND_ADDRESS}?request=logout`, {
        //     method: 'GET'
        // });

        // if (result.status !== 200) {
        //     this.props.setModalState("error");
        //     return;
        // }
        // let data = await result.json();

        // if (data[0]) {
        //     this.props.clearLogin();
        //     this.props.setModalState("");
        //     this.props.hideMainModal();
        // }
        // else this.props.setModalState("error");
        this.props.clearLogin();
        this.props.setModalState("");
        this.props.hideMainModal();

    }
    async saveFetch() {
        this.props.setModalState("loading");
        let result = await fetch(`${BACKEND_ADDRESS}?request=save`, {
            method: 'POST',
            body: JSON.stringify({ boardJSON: this.props.boardJSON, size: this.props.size, score: this.props.score })
        });

        if (result.status !== 200) {
            this.props.setModalState("error");
            return;
        }
        let data = await result.json();

        if (data[0]) {
            this.props.setModalState("success.save");
        }
        else this.props.setModalState("error");
    }
    async loadFetch() {
        let result = await fetch(`${BACKEND_ADDRESS}?request=load`, {
            method: 'GET'
        });

        if (result.status !== 200) {
            this.props.setModalState("error");
            return;
        }
        let data = await result.json();

        if (data[0]) {
            this.setState({ fetchContent: data });
        }
        else this.props.setModalState("error");
    }
    async scoreFetch() {
        let result = await fetch(`${BACKEND_ADDRESS}?request=highscore`, {
            method: 'GET'
        });

        if (result.status !== 200) {
            this.props.setModalState("error");
            return;
        }
        let data = await result.json();

        if (data[0]) {
            this.setState({ fetchContent: data });
        }
        else this.props.setModalState("error");
    }
    loading() {
        return (
            <div className="d-flex flex-column" style={{ width: "25rem" }}>
                <div className="d-flex flex-column b-round bg-w p-4">
                    <div className="modal_title m-auto">Loading...</div>
                </div>
            </div>
        )
    }
    error() {
        return (
            <div className="d-flex flex-column" style={{ width: "25rem" }}>
                <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                    <i className="fas fa-bug mx-auto mb-3 modal_title"></i>
                    <div className="modal_title m-auto">Something went wrong...</div>
                </div>
                <div className="d-flex justify-content-around bg-w b-round p-2">
                    <button className="modal_bt px-3" onClick={this.props.hideMainModal}>Ok</button>
                </div>
            </div>
        )
    }
    missing(cb) {
        return (
            <div className="d-flex flex-column" style={{ width: "28rem" }}>
                <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                    <i className="fas fa-question mx-auto mb-3 modal_title"></i>
                    <div className="modal_title m-auto">Form incomplete (mismatch)</div>
                </div>
                <div className="d-flex justify-content-around bg-w b-round p-2">
                    <button className="modal_bt px-3" onClick={() => {
                        if (cb == "signin") this.props.setModalState("signin");
                        else if (cb == "signup") this.props.setModalState("signup");
                    }}>Back</button>
                </div>
            </div>
        )
    }
    dup() {
        return (
            <div className="d-flex flex-column" style={{ width: "28rem" }}>
                <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                    <i className="fas fa-exclamation mx-auto mb-3 modal_title"></i>
                    <div className="modal_title m-auto">Username already exists</div>
                </div>
                <div className="d-flex justify-content-around bg-w b-round p-2">
                    <button className="modal_bt px-3" onClick={() => {
                        this.props.setModalState("signup");
                    }}>Back</button>
                </div>
            </div>
        )
    }
    logout() {
        return (
            <div className="d-flex flex-column" style={{ width: "28rem" }}>
                <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                    <i className="fas fa-sign-out-alt mx-auto mb-3 modal_title"></i>
                    <div className="modal_title m-auto">Are you sure to logout?</div>
                </div>
                <div className="d-flex justify-content-around bg-w b-round p-2">
                    <button className="modal_bt px-3" onClick={this.props.hideMainModal}>Cancel</button>
                    <button className="modal_bt fc-p px-3" onClick={() => { this.logoutFetch() }}>Confirm</button>
                </div>
            </div>
        )
    }
    success(action) {
        let message = "";
        if (action == "signup") message = "Signup complete!";
        else if (action == "save") message = "Game saved";
        return (
            <div className="d-flex flex-column" style={{ width: "28rem" }}>
                <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                    <i className="fas fa-check mx-auto mb-3 modal_title"></i>
                    <div className="modal_title m-auto">{message}</div>
                </div>
                <div className="d-flex justify-content-around bg-w b-round p-2">
                    <button className="modal_bt px-3" onClick={() => { this.props.hideMainModal() }}>Back</button>
                </div>
            </div>
        )
    }
    save() {
        return (
            <div className="d-flex flex-column" style={{ width: "28rem" }}>
                <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                    <i className="fas fa-save mx-auto mb-3 modal_title"></i>
                    <div className="modal_title m-auto">Save current game?</div>
                </div>
                <div className="d-flex justify-content-around bg-w b-round p-2">
                    <button className="modal_bt px-3" onClick={this.props.hideMainModal}>Cancel</button>
                    <button className="modal_bt fc-p px-3" onClick={() => { this.saveFetch() }}>Confirm</button>
                </div>
            </div>
        )
    }
    over() {
        return (
            <div className="d-flex flex-column" style={{ width: "28rem" }}>
                <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                    <i className="fas fa-skull mx-auto mb-3 modal_title fs-3"></i>
                    <div className="modal_title m-auto">Game over</div>
                    <div className="modal_title m-auto">{`Score ${numberWithCommas(this.props.score)}`}</div>
                </div>
                <div className="d-flex justify-content-around bg-w b-round p-2">
                    <button className="modal_bt px-3" onClick={this.props.hideMainModal}>Back</button>
                    <button className="modal_bt fc-p px-3" onClick={() => { this.props.setModalState("newGame") }}>New game</button>
                </div>
            </div>
        )
    }
    preview(boardJSON, size) {
        if (!boardJSON) return (<div className="d-flex flex-column modal_board_img mt-3 mx-4" />)
        let board = JSON.parse(boardJSON);
        let result = [];
        let i = 0;
        for (let row of board) {
            let rowR = [];
            for (let cell of row) {
                rowR.push(
                    <div className="flex-grow-1 d-flex p-05" key={`${i}preview${size}`}>
                        <div className="w-100 h-100" style={{ backgroundColor: getTileColor(parseInt(cell)) ? getTileColor(parseInt(cell)) : "#f7f7f7", borderRadius: "0.2rem" }} />
                    </div>
                );
                i += 1;
            }
            result.push(<div className="flex-grow-1 d-flex" key={`${i}previewR${size}`}>{rowR}</div>);
        }
        return (
            <div className="d-flex flex-column modal_board_img mt-3 mx-4">
                {result}
            </div>
        )
    }
    load() {
        if (this.state.fetchContent[0] == 'load') {
            let saves = this.state.fetchContent[1];
            let btns = [];
            for (let save of saves) {
                btns.push(
                    <button className={`d-flex flex-column b-round shadow modal_bt off fs-1`} onClick={() => { this.props.loadGame(save[0], save[1], save[2], save[3]); this.props.hideMainModal() }} key={save[1] + "save"}>
                        {this.preview(save[0], save[1])}
                        <div className="mx-auto my-3">{`${save[1]}X${save[1]}`}</div>
                        <div className="mx-auto mb-3">{save[3] ? `Score: ${save[2]}` : "N/A"}</div>
                        <div className="mx-auto mb-3">{save[3] ? save[3] : "Empty save"}</div>
                    </button>
                );
            }
            return (
                <div className="d-flex flex-column" style={{ width: "40rem" }}>
                    <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                        <div className="modal_title mx-auto mb-4">Choose a save to load</div>
                        <div className="d-flex flex-row justify-content-around mb-4">
                            {btns}
                        </div>
                    </div>
                    <div className="d-flex justify-content-around bg-w b-round p-2">
                        <button className="modal_bt px-3" onClick={() => {
                            this.props.hideMainModal();
                        }}>Back</button>
                    </div>
                </div>
            )
        }
        else {
            return this.loading();
        }

    }
    highscore() {
        if (this.state.fetchContent[0] == 'score') {
            let cols = [];
            let i = 0;
            for (let s of this.state.fetchContent[1]) {
                let scores = [];
                let j = 1;
                for (let record of s) {
                    let place = <div className="placenum">{j}</div>;
                    if (j == 1) place = <i className="fas fa-trophy my-auto placenum" style={{ color: "#ff753f" }}></i>;
                    else if (j == 2) place = <i className="fas fa-trophy my-auto placenum" style={{ color: "#ffad6d" }}></i>;
                    else if (j == 3) place = <i className="fas fa-trophy my-auto placenum" style={{ color: "#ffe49a" }}></i>;
                    
                    scores.push(
                        <div className="d-flex flex-row my-2 mx-3" key={"sbc" + j}>
                            {place}
                            <div className="mr-auto">{record[2]}</div>
                            <div className="">{numberWithCommas(record[0])}</div>
                        </div>
                    );
                    j += 1;
                }
                let size = [4, 5, 6][i];
                cols.push(
                    <div className="d-flex flex-column" key={"sb" + i}>
                        <div className="d-flex flex-column b-round scoreboard-title py-2 text-center modal_title mb-2 fs-1">
                            {size + "X" + size}
                        </div>
                        <div className="d-flex flex-column b-round scoreboard font-weight-bold">
                            {scores}
                        </div>
                    </div>
                );
                i += 1;
            }
            return (
                <div className="d-flex flex-column" style={{ width: "60rem" }}>
                    <div className="d-flex flex-column b-round bg-w p-4 mb-2">
                        <div className="modal_title mx-auto mb-4">Scoreboard</div>
                        <div className="d-flex flex-row justify-content-around mb-4">
                            {cols}
                        </div>
                    </div>
                    <div className="d-flex justify-content-around bg-w b-round p-2">
                        <button className="modal_bt px-3" onClick={() => {
                            this.props.hideMainModal();
                        }}>Back</button>
                    </div>
                </div>
            )
        }
        else {
            return this.loading();
        }
    }
    render() {
        let modalContent = "";
        switch (this.props.modalState.split(".")[0]) {
            case "newGame":
                modalContent = this.newGame();
                break;
            case "signin":
                modalContent = this.signin();
                break;
            case "signup":
                modalContent = this.signup();
                break;
            case "loading":
                modalContent = this.loading();
                break;
            case "missing":
                modalContent = this.missing(this.props.modalState.split(".")[1]);
                break;
            case "error":
                modalContent = this.error();
                break;
            case "logout":
                modalContent = this.logout();
                break;
            case "save":
                modalContent = this.save();
                break;
            case "load":
                modalContent = this.load();
                break;
            case "highscore":
                modalContent = this.highscore();
                break;
            case "over":
                modalContent = this.over();
                break;
            case "success":
                modalContent = this.success(this.props.modalState.split(".")[1]);
                break;
            default:
                break;
        }
        return (
            <div className="C_modal_container d-none" id="mainModal" onClick={(e) => {
                if (e.target.id == 'mainModal') {
                    if (!["loading", "missing"].includes(this.props.modalState.split(".")[0])) this.props.hideMainModal()
                }
            }}>
                <div className="C_modal my-auto d-flex">
                    {modalContent}
                </div>
            </div>
        )
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            matrix: [],
            transition: [],
            nextMatrix: [],
            inTransition: false,
            pendingNew: false,
            direction: "",
            stage: 0
        }
        this.newMatrix = this.newMatrix.bind(this);
        this.spawnTile = this.spawnTile.bind(this);
        this.isFull = this.isFull.bind(this);
        this.keyHandler = this.keyHandler.bind(this);
        this.zeroMatrix = this.zeroMatrix.bind(this);
        this.move = this.move.bind(this);
        this.shiftRowLeft = this.shiftRowLeft.bind(this);
        this.mergeRowLeft = this.mergeRowLeft.bind(this);
        this.nextIdx = this.nextIdx.bind(this);
        this.shiftRest = this.shiftRest.bind(this);
        this.isOver = this.isOver.bind(this);
        this.checkAdj = this.checkAdj.bind(this);
        this.saveScore = this.saveScore.bind(this);
    }
    componentDidMount() {
        if (this.props.loadJSON) {
            let board = JSON.parse(this.props.loadJSON);
            let transition = [];
            for (let i = 0; i < this.props.size; i++) {
                let row = [];
                for (let j = 0; j < this.props.size; j++) {
                    row.push(0);
                }
                transition.push([...row]);
            }
            this.setState({ matrix: board, transition: transition, nextMatrix: board, inTransition: true });
            document.onkeydown = this.keyHandler;
        }
        else {
            this.newMatrix();
            document.onkeydown = this.keyHandler;
        }
    }
    componentDidUpdate(prevProps, prevState) {
        if (this.state.inTransition) {
            if (this.state.pendingNew) {
                setTimeout(() => {
                    let nextMatrix = JSON.parse(JSON.stringify(this.state.nextMatrix));
                    let transition = [];
                    this.zeroMatrix(transition);

                    if (Math.random() <= 0.1) this.spawnTile(4, nextMatrix, transition);
                    else this.spawnTile(2, nextMatrix, transition);

                    for (let cell of mergeAni) {
                        transition[cell[0]][cell[1]] = { action: "pop" };
                    }

                    let newStage = this.state.stage + 1;

                    this.setState({ inTransition: true, pendingNew: false, matrix: nextMatrix, transition: transition, nextMatrix: nextMatrix, stage: newStage });
                    this.props.setJSON(JSON.stringify(this.state.nextMatrix));
                }, TRANSTIME)
            }
            else {
                setTimeout(() => {
                    let newStage = this.state.stage + 1;

                    this.setState({ inTransition: false, matrix: this.state.nextMatrix, stage: newStage });
                    this.props.setJSON(JSON.stringify(this.state.nextMatrix));
                    // TODO: check if game over
                }, TRANSTIME)
            }

        }
        if (this.props.user != prevProps.user && this.props.user != "Sign in") {
            if (this.isOver(this.state.matrix)) this.saveScore();
        }
        if (JSON.stringify(this.state.matrix) != JSON.stringify(prevState.matrix)) {
            if (this.isOver(this.state.matrix)) {
                this.props.setModalState("over");
                this.props.showMainModal();
                this.saveScore();
            }
        }
    }
    async saveScore() {
        if (this.props.user != "Sign in") {
            let result = await fetch(`${BACKEND_ADDRESS}?request=over`, {
                method: 'POST',
                body: JSON.stringify({ score: this.props.score, size: this.props.size })
            });
        }
    }
    newMatrix() {
        let matrix = [];
        let transition = [];
        for (let i = 0; i < this.props.size; i++) {
            let row = [];
            for (let j = 0; j < this.props.size; j++) {
                row.push(0);
            }
            matrix.push(row);
            transition.push([...row]);
        }

        this.spawnTile(2, matrix, transition);
        this.spawnTile(2, matrix, transition);
        let nextMatrix = matrix;
        this.setState({ matrix: matrix, transition: transition, nextMatrix: nextMatrix, inTransition: true });
    }
    spawnTile(value, matrix, transition) {
        if (this.isFull(matrix)) return false;

        let s = this.props.size;
        while (true) {
            let x = randint(s);
            let y = randint(s);
            if (matrix[x][y] == 0) {
                matrix[x][y] = value;
                transition[x][y] = { action: "new", value: value };
                break
            }
        }
        return true;
    }
    isOver(matrix) {
        if (!this.isFull(matrix)) return false;

        for (let i = 0; i < this.props.size; i++) {
            for (let j = 0; j < this.props.size; j++) {
                if (this.checkAdj(matrix, i, j)) return false;
            }
        }
        return true;
    }
    checkAdj(matrix, i, j) {
        let s = this.props.size;
        let l = [];
        if (i - 1 >= 0) l.push(matrix[i][j] == matrix[i - 1][j]);
        if (i + 1 < s) l.push(matrix[i][j] == matrix[i + 1][j]);
        if (j - 1 >= 0) l.push(matrix[i][j] == matrix[i][j - 1]);
        if (j + 1 < s) l.push(matrix[i][j] == matrix[i][j + 1]);

        return l.includes(true);
    }
    isFull(m) {
        let matrix = m.flat();
        return !matrix.includes(0);
    }
    keyHandler(e) {
        if (this.state.inTransition || this.state.pendingNew || this.props.modalOpen) return;
        switch (e.key) {
            case "ArrowLeft":
            case "a":
                this.move("L");
                break;
            case "ArrowDown":
            case "s":
                this.move("D");
                break;
            case "ArrowRight":
            case "d":
                this.move("R");
                break;
            case "ArrowUp":
            case "w":
                this.move("U");
                break;
            default:
                break;
        }
    }
    zeroMatrix(transition) {
        for (let i = 0; i < this.props.size; i++) {
            let row = [];
            for (let j = 0; j < this.props.size; j++) {
                row.push(0);
            }
            transition.push(row);
        }
    }
    move(direction) {
        const matrix = this.state.matrix;
        let newMatrix = [];
        let transition = [];

        if (direction == "L") {
            for (const row of matrix) {
                let transRow = [];
                let shiftedRow = this.shiftRowLeft(row, transRow);
                let resultRow = this.mergeRowLeft(shiftedRow, transRow, row);
                newMatrix.push(resultRow);
                transition.push(transRow);
            }
        }
        else if (direction == "R") {
            for (const r of matrix) {
                const row = [...r].reverse();
                let transRow = [];
                let shiftedRow = this.shiftRowLeft(row, transRow);
                let resultRow = this.mergeRowLeft(shiftedRow, transRow, row);
                newMatrix.push(resultRow.reverse());
                transition.push(transRow.reverse());
            }
        }
        else if (direction == "U") {
            this.zeroMatrix(newMatrix);
            this.zeroMatrix(transition);
            for (let col = 0; col < this.props.size; col++) {
                let row = [];
                for (let r = 0; r < this.props.size; r++) row.push(matrix[r][col])

                let transRow = [];
                let shiftedRow = this.shiftRowLeft(row, transRow);
                let resultRow = this.mergeRowLeft(shiftedRow, transRow, row);
                for (let r = 0; r < this.props.size; r++) {
                    newMatrix[r][col] = resultRow[r];
                    transition[r][col] = transRow[r];
                }
            }
        }
        else if (direction == "D") {
            this.zeroMatrix(newMatrix);
            this.zeroMatrix(transition);
            for (let col = 0; col < this.props.size; col++) {
                let row = [];
                for (let r = (this.props.size - 1); r >= 0; r--) row.push(matrix[r][col])

                let transRow = [];
                let shiftedRow = this.shiftRowLeft(row, transRow);
                let resultRow = this.mergeRowLeft(shiftedRow, transRow, row);

                for (let r = (this.props.size - 1); r >= 0; r--) {
                    newMatrix[r][col] = resultRow[this.props.size - 1 - r];
                    transition[r][col] = transRow[this.props.size - 1 - r];
                }
            }
        }


        let flatTrans = transition.flat();
        if (flatTrans.every((x) => { return x == 0 })) return;

        let score = this.props.score;
        for (let cell of transition.flat()) {
            if (cell) {
                if (cell.action == "merge") score += cell.value;
                else if (cell.action == "shiftMerge") score += cell.merge;
            }
        }
        this.props.setScore(score);

        this.setState({ nextMatrix: newMatrix, transition: transition, inTransition: true, pendingNew: true, direction: direction });
    }
    shiftRowLeft(row, transRow) {
        let shiftCount = 0;
        let newRow = [];

        for (let i = 0; i < row.length; i++) {
            if (row[i] == 0) {
                shiftCount += 1;
                transRow.push(0)
            }
            else {
                newRow.push(row[i]);
                if (shiftCount == 0) transRow.push(0);
                else transRow.push({ action: "shift", value: shiftCount });
            }
        }
        let remain = row.length - newRow.length;
        for (let i = 0; i < remain; i++) {
            newRow.push(0);
        }
        return newRow;
    }
    mergeRowLeft(row, transRow, orgRow) {
        let newRow = [];
        for (let x of row) newRow.push(0);

        let transIdx = -1;

        for (let i = 0; i < row.length; i++) {
            if (row[i] == 0) break;
            transIdx = this.nextIdx(orgRow, transIdx, row[i]);
            if (i != (row.length - 1)) {
                if (row[i] == row[i + 1]) {
                    newRow[i] = row[i] * 2;
                    newRow[i + 1] = 0;

                    if (transIdx != -1) {
                        if (transRow[transIdx] != 0) {
                            // if the item is also shifted
                            let shiftCount = transRow[transIdx].value;
                            transRow[transIdx] = { action: "shiftMerge", merge: row[i] * 2, shift: shiftCount };
                        }
                        else {
                            transRow[transIdx] = { action: "merge", value: row[i] * 2 }
                        }

                        let nextTransIdx = this.nextIdx(orgRow, transIdx, row[i + 1]);

                        if (transRow[nextTransIdx] != 0) {
                            // if the item is also shifted
                            let shiftCount = transRow[nextTransIdx].value + 1;
                            transRow[nextTransIdx] = { action: "shiftDelete", value: shiftCount };
                        }
                        else {
                            transRow[nextTransIdx] = { action: "shiftDelete", value: 1 };
                        }
                        transIdx = nextTransIdx;
                        this.shiftRest(transRow, transIdx, orgRow);
                    }

                    i += 1;
                }
                else {
                    newRow[i] = row[i];
                }
            }
            else newRow[i] = row[i];
        }
        let result = this.shiftRowLeft(newRow, new Array())

        return result;
    }
    nextIdx(orgRow, start, value) {
        for (let i = start; i < orgRow.length; i++) {
            if (i == start || i == -1) continue;
            if (orgRow[i] == value) return i;
        }
        return -1;
    }
    shiftRest(transRow, start, orgRow) {
        for (let i = start; i < orgRow.length; i++) {
            if (i == start) continue;
            if (orgRow[i] != 0) {
                let shiftCount = transRow[i].value ? transRow[i].value + 1 : 1;
                transRow[i] = { action: "shift", value: shiftCount };
            }
        }
    }
    render() {
        let matrix = this.state.matrix;
        let dimension = this.props.size * 8 + (this.props.size + 1) * 0.5;
        mergeAni = []

        let board = [];
        board.push(<div style={{ marginTop: `${MARGIN}rem`, height: `${CELL_SIZE}rem` }} key={`margintop`}></div>);
        for (let i = 0; i < this.props.size; i++) {
            let row = [];
            row.push(<div style={{ marginLeft: `${MARGIN}rem`, height: `${CELL_SIZE}rem` }} key={`margin${i}`}></div>)
            for (let j = 0; j < this.props.size; j++) {
                row.push(<div className="game-board-cell" key={`cell${i}${j}`}></div>);
            }
            board.push(<div className="d-flex" style={{ marginBottom: `${MARGIN}rem` }} key={`row${i}`}>{row}</div>);
        }

        let tiles = [];
        if (this.state.matrix.length != 0) {
            tiles.push(<div style={{ marginTop: `${MARGIN}rem`, height: `${CELL_SIZE}rem` }} key={`Tmargintop`}></div>);
            for (let i = 0; i < this.props.size; i++) {
                let rowT = [];
                rowT.push(<div style={{ marginLeft: `${MARGIN}rem`, height: `${CELL_SIZE}rem` }} key={`Tmargin${i}`}></div>)
                for (let j = 0; j < this.props.size; j++) {
                    if (this.state.inTransition) {
                        let transition = this.state.transition[i][j];
                        let cellVal = matrix[i][j];
                        let translate = { x: 0, y: 0 };
                        let aniClass = "";

                        if (this.state.transition[i][j]) {
                            switch (transition.action) {
                                case "new":
                                    aniClass = "newTile";
                                    break;
                                case "merge":
                                    aniClass = "top";
                                    cellVal = this.state.transition[i][j].value;
                                    mergeAni.push([i, j]);
                                    break;
                                case "pop":
                                    aniClass = "merge";
                                    break;
                                case "shiftMerge":
                                    aniClass = "top";
                                    cellVal = this.state.transition[i][j].merge;
                                    if (this.state.direction == "L") {
                                        translate.x = -1 * this.state.transition[i][j].shift * (CELL_SIZE + MARGIN);
                                        mergeAni.push([i, j - this.state.transition[i][j].shift]);
                                    }
                                    else if (this.state.direction == "R") {
                                        translate.x = this.state.transition[i][j].shift * (CELL_SIZE + MARGIN);
                                        mergeAni.push([i, j + this.state.transition[i][j].shift]);
                                    }
                                    else if (this.state.direction == "U") {
                                        translate.y = -1 * this.state.transition[i][j].shift * (CELL_SIZE + MARGIN);
                                        mergeAni.push([i - this.state.transition[i][j].shift, j]);
                                    }
                                    else if (this.state.direction == "D") {
                                        translate.y = this.state.transition[i][j].shift * (CELL_SIZE + MARGIN);
                                        mergeAni.push([i + this.state.transition[i][j].shift, j]);
                                    }
                                    break;
                                case "shiftDelete":
                                    aniClass = "delete";
                                    if (this.state.direction == "L") {
                                        translate.x = -1 * this.state.transition[i][j].value * (CELL_SIZE + MARGIN);
                                    }
                                    else if (this.state.direction == "R") {
                                        translate.x = this.state.transition[i][j].value * (CELL_SIZE + MARGIN);
                                    }
                                    else if (this.state.direction == "U") {
                                        translate.y = -1 * this.state.transition[i][j].value * (CELL_SIZE + MARGIN);
                                    }
                                    else if (this.state.direction == "D") {
                                        translate.y = this.state.transition[i][j].value * (CELL_SIZE + MARGIN);
                                    }
                                    break;
                                case "shift":
                                    if (this.state.direction == "L") {
                                        translate.x = -1 * this.state.transition[i][j].value * (CELL_SIZE + MARGIN);
                                    }
                                    else if (this.state.direction == "R") {
                                        translate.x = this.state.transition[i][j].value * (CELL_SIZE + MARGIN);
                                    }
                                    else if (this.state.direction == "U") {
                                        translate.y = -1 * this.state.transition[i][j].value * (CELL_SIZE + MARGIN);
                                    }
                                    else if (this.state.direction == "D") {
                                        translate.y = this.state.transition[i][j].value * (CELL_SIZE + MARGIN);
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                        let color = getTileColor(cellVal);
                        if (!color) color = "transparent";

                        rowT.push(<div className={"game-tile-cell d-flex " + aniClass} key={`Tcell${i}${j}${this.state.stage}`} style={{ backgroundColor: color, transform: `translate(${translate.x}rem,${translate.y}rem)` }}><div className={"m-auto " + (cellVal > 2048 ? "fs-25" : "fs-3")}>{cellVal != 0 ? cellVal : ""}</div></div>);
                    }
                    else {
                        let color = getTileColor(matrix[i][j]);
                        if (!color) color = "transparent";

                        rowT.push(<div className="game-tile-cell d-flex" key={`Tcell${i}${j}${this.state.stage}`} style={{ backgroundColor: color }}><div className={"m-auto " + (matrix[i][j] > 2048 ? "fs-25" : "fs-3")}>{matrix[i][j] != 0 ? matrix[i][j] : ""}</div></div>);
                    }

                }
                tiles.push(<div className="d-flex" style={{ marginBottom: `${MARGIN}rem` }} key={`Trow${i}`}>{rowT}</div>);
            }
        }

        return (
            <div className="d-flex flex-column" style={{ position: "relative" }}>
                <div className="d-flex flex-column b-round shadow" style={{ width: `${dimension}rem`, height: `${dimension}rem`, minWidth: `${dimension}rem`, minHeight: `${dimension}rem` }}>
                    {board}
                </div>
                <div className="d-flex flex-column" style={{ width: `${dimension}rem`, height: `${dimension}rem`, minWidth: `${dimension}rem`, minHeight: `${dimension}rem`, position: "absolute" }}>
                    {tiles}
                </div>
            </div>
        )
    }
}
function randint(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
function getTileColor(num) {
    if (num == 0) return false;
    let colors = ["#ffe49a", "#ffdc94", "#ffd48d", "#ffcc87", "#ffc480", "#ffbc7a", "#ffb473", "#ffad6d", "#ffa566", "#ff9d5f", "#ff9559", "#ff8d52", "#ff854c", "#ff7d45", "#ff753f"];
    let idx = Math.log2(num) - 1;
    if (idx > 14) idx = 14;
    return colors[idx];
}
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

ReactDOM.render(<App />, document.getElementById('app'));