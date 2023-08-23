## RULES OF BS-ZPY
_created by Alice Nie_

The rules of BS-ZPY compared against normal ZPY. If you don't know the rules of normal ZPY refer to [this page](https://robertying.com/shengji/rules.html).

The main difference lies in how tricks are played so we'll start by explaining that.

# Playing Tricks
The general idea is that every person will play cards face down and will claim what the facedown cards are similar to the card game [BS](https://en.wikipedia.org/wiki/Cheat_(game))

Before the next player plays any card any player can call `BS`. If `BS` is called, the cards must be revealed.

-If the person is caught lying then they must forfeit 2 random cards from their winnings pile to the person who called `BS`. If they have no cards instead they will lose 5 points. Lying includes the person is playing an invalid hand. For instance, if the player plays a trump but their hand is not out of a suit this is an invalid play. This player can no longer win the trick. 

-If the person is telling the truth then the person who calls `BS` must forfeit 2 random cards from their winning pile. If they have no cards the person who called `BS` will lose 5 points.

In the case no one calls `BS` for that trick the face down cards are considered to be what that player claimed. If the player was lying they must say `peanut butter`. 

Suppose `BS` is called on the first person and the first person is playing an invalid hand. In this case take the _smallest_ valued hand which is a subset of the hand which they played and return the other hands back into their hand. 

If every single person before the last person is caught lying then no one can call `BS` on the last person. 

Unless `BS` is called, cards are _not revealed_ at the end of the trick. Instead, the person who wins the trick by claiming the highest hand wins all the cards played that turn. The eventual score is equal to the number of points in the winning pile.

# Bidding For Trump, Exchanging Cards in Bottom (底牌)
Happens as normal.

# Declaring Friends
The dictator will declare friend cards as normal. However, the person to join their team will be the first person to successfully claim playing the friend card. 

For instance, suppose player A is dictator and declares the first A♠ is their friend. Then in some round player B plays the 10♠ while claiming it is the A♠ and nobody calls `BS`. Then player B would be player A's friend even though player B never actually played A♠.

# Scoring
As detailed before, the score is equal to the number of points in the winning pile subtracted by any other point penalties which may have occured. 底牌 is counted as normal.

Due to the penalties of losing points and stealing cards from the winning pile both the dictator and attacking team will keep track of their points. 

# Level Up 
For $n$ decks the interval change is determined by

$$\delta = \lfloor{\dfrac{\text{Attacking Score} - \text{Dictator Score}}{20n}}\rfloor + 1$$

For example, suppose the attacking score is $105$ and the dictator score is $195$ playing with $3$ decks. Then 

$$\delta = \lfloor{\dfrac{-80}{60}}\rfloor + 1 = -1$$

which means the dictator team goes up by $1$ level. 